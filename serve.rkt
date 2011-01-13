#lang racket
(require web-server/web-server
         racket/runtime-path
         (prefix-in files: web-server/dispatchers/dispatch-files)
         web-server/dispatchers/filesystem-map)
(define-runtime-path base ".")

(serve
 #:dispatch
 (files:make
  #:url->path (make-url->path base))
 #:port 8080)

(do-not-return)