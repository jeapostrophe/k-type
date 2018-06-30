window.CANVAS_WIDTH = 360;
window.CANVAS_HEIGTH = 640;

window.sendData = function(data) {
    var xhr = new XMLHttpRequest();

    data['branch'] = 'master';

    var body = JSON.stringify(data);

    xhr.open("POST", '/api', true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function () {
        if (this.readyState != 4) return;

        // console.log(data);
    };

    xhr.send(body);
}

window.rtype = (function () {
    var ratingElement = document.getElementById('rating');

    var fields = {
        'position': '#',
        'score': 'score',
        'wave': 'wave',
        'hits': 'hits',
        'misses': 'misses',
        'accuracy': 'acc%'
    };

    var keys = Object.keys(fields);

    function drawUserRating(games) {
        var tbl = document.createElement('table');
        tbl.className = 'tbl';
        for (var i = -1; i < games.length && i < 20; i++) {
            if (i >= 0) {
                games[i]['position'] = i + 1;
                var accuracy = games[i].hits ? games[i].hits / (games[i].hits + games[i].misses) * 100 : 0;
                games[i]['accuracy'] = accuracy.toFixed(2);

            }
            var tr = document.createElement('tr');
            keys.forEach(function(key) {
                var e;
                if (i < 0) {
                    tr.className = 'thead';
                    e = document.createElement('th');
                    e.innerHTML = fields[key];
                } else {
                    e = document.createElement('td');
                    e.innerHTML = games[i][key];
                }
                tr.appendChild(e);
            })
            tbl.appendChild(tr);
        }
        ratingElement.style.left = 'calc(50% + ' + (CANVAS_WIDTH / 2 + 50) + 'px)';
        ratingElement.style.top = 'calc(50% - ' + (tbl.offsetHeight / 2 + CANVAS_HEIGTH / 2) + 'px)';
        ratingElement.innerHTML = tbl.outerHTML;
        ratingElement.style.display = 'inline-block';
    }

    function drawRating() {
        var games = rStorage.getGames();
        if (games && games.length > 0) {
            drawUserRating(games);
        } else {
            ratingElement.style.display = 'none';
        }
    }

    function attachListeners() {
        var btns = document.getElementsByClassName('footer_btn');
        for (var i = 0; i < btns.length; i++) {
            btns[i].addEventListener('click', function(e) {
                sendData({
                    action: 'btn_click',
                    btn_name: this.dataset.name
                });
            })
        }
    }

    function createSettingsRadioElement(type, name, caption) {
        var container = document.createElement('label');
        container.className = 'form-radio';
        container.innerHTML = caption;

        var radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = type;
        radio.value = name;

        radio.addEventListener('click', function (e) {
            rStorage.saveSetting(type, name);

            if (window.ig && window.ig.game) {
                window.ig.game.setTitle();
            }

            drawRating();
        });

        var span = document.createElement('span');
        span.className = 'checkmark';

        container.appendChild(radio);
        container.appendChild(span);

        return {
            container: container,
            radio: radio
        };
    }

    function prepareSettings() {
        var dictionaryContainer = document.getElementById("settings_dictionary");
        var dicts = [{
            key: 'russian',
            label: 'основной'
        }];

        var savedDict = rStorage.getSetting('dict', 'russian');
        dicts.forEach(function(dict) {
            var e = createSettingsRadioElement('dict', dict.key, dict.label);
            if (dict.key == savedDict) {
                e.radio.checked = 'checked';
            }

            dictionaryContainer.appendChild(e.container);
        })

        var difficultyContainer = document.getElementById("settings_difficulty");

        var difficulties = [{key: 'easy', label: 'легко'}, {key: 'hard', label: 'сложно'}];
        var savedDifficulty = rStorage.getSetting('difficulty', 'easy');

        difficulties.forEach(function (difficulty) {
            var e = createSettingsRadioElement('difficulty', difficulty.key, difficulty.label);
            if (difficulty.key == savedDifficulty) {
                e.radio.checked = 'checked';
            }
            difficultyContainer.appendChild(e.container);
        });

        var settingsElement = document.getElementById("settings");
        settingsElement.style.left = 'calc(50% - ' + (CANVAS_WIDTH / 2 + 50 + 150) + 'px)';
        settingsElement.style.top = 'calc(50% - ' + (settingsElement.offsetHeight / 2 + CANVAS_HEIGTH / 2 - 350) + 'px)';
        settingsElement.style.display = 'inline-block';
    }

    return {
        init: function() {
            this.drawRating();
            attachListeners();
            prepareSettings();
        },
        drawRating: drawRating
    }
}());