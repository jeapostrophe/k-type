#lang racket
(require xml
         racket/runtime-path
         (for-syntax racket))

(define-syntax (unicode-table stx)
  (syntax-case stx ()
    [(_ str-stx)
     (let ()
       (define str (syntax->datum #'str-stx))
       (define rows (port->lines (open-input-string str)))
       (define points (map (curry regexp-split #rx"\t") rows))
       (define char-code*replacement
         (for/fold ([l empty])
           ([row-of-points (in-list points)])
           (define base (first row-of-points))
           (define base-num-str (string-append (substring base 2 5) "0"))
           (define base-char (string->number base-num-str 16))
           (for/fold ([l l])
             ([replacement (in-list (rest row-of-points))]
              [i (in-naturals)])
             (list* (cons (integer->char (+ base-char i)) replacement)
                    l))))
       (with-syntax ([([char . repl] ...) char-code*replacement])
         (syntax/loc stx
           (match-lambda
             [char repl]
             ...
             [x (string x)]))))]))


; D encodes "duplicate next consonant"
; R encodes "replace last vowel with nothing"
(define romaji-char
  (unicode-table #<<END
U+304x	 	a	a	i	i	u	u	e	e	o	o	ka	ga	ki	gi	ku
U+305x	ge	ke	ge	ko	go	sa	za	shi	ji	su	zu	se	ze	so	zo	ta
U+306x	da	chi	di	D	tsu	du	te	de	to	do	na	ni	nu	ne	no	ha
U+307x	ba	pa	hi	bi	pi	fu	bu	pu	he	be	pe	ho	bo	po	ma	mi
U+308x	mu	me	mo	Rya	ya	Ryu	yu	Ryo	yo	ra	ri	ru	re	ro	wa	wa
U+309x	ゐ	ゑ	wo	n	ゔ	ka	ke	 	 	゙	゚	 ゙	゜	ゝ	ゞ	yori
U+30Ax	゠	a	a	i	i	u	u	e	e	o	o	ka	ga	ki	gi	ku
U+30Bx	gu	ke	ge	ko	go	sa	za	shi	ji	su	zu	se	ze	so	zo	ta
U+30Cx	da	chi	di	D	tsu	du	te	de	to	do	na	ni	nu	ne	no	ha
U+30Dx	ba	pa	hi	bi	pi	fu	bu	pu	he	be	pe	ho	bo	po	ma	mi
U+30Ex	mu	me	mo	Rya	ya	Ryu	yu	Ryo	yo	ra	ri	ru	re	ro	wa	wa
U+30Fx	ヰ	ヱ	wo	n	ヴ	ka	ke	ヷ	ヸ	ヹ	ヺ	・	ー	ヽ	ヾ	yori
END
                 ))

(define (romaji s)
  (regexp-replace* #rx"D(.)"
                   (regexp-replace* #rx".R"
                                    (apply string-append (map romaji-char (string->list s)))
                                    "")
                   "\\1\\1"))

(define-runtime-path dict-pth "JMdict")
(define entries (make-hasheq))
(with-input-from-file dict-pth
    (λ ()
      (for/fold ([keb #f])
        ([l (in-lines)])
        (match l
          [(regexp #rx"^\\<keb\\>(.+)\\<\\/keb\\>" (list _ keb))
           keb]
          [(and (? (λ (x) keb)) (regexp #rx"^\\<reb\\>(.+)\\<\\/reb\\>" (list _ reb)))
           (define teb (romaji reb))
           (hash-update! entries (string-length teb) (curry list* (cons keb teb)) empty)
           #f]
          [_
           keb]))))

(define-runtime-path compiled-pth "JMdict.js")
(with-output-to-file compiled-pth
  #:exists 'replace
  (λ ()
    (display #<<END
ig.module('dicts.JMdict').defines(function () {
    WORDS = {
END
             )
    (for ([(i es) (in-hash entries)])
      (printf "~a:[" i)
      (for ([e (in-list es)])
        (printf "['~a','~a']," (car e) (cdr e)))
      (printf "],\n"))
    
    (display #<<END
};});
END
             )))
