window.rStorage = (function () {
    function getStorageKeyWithSettings(key, settings) {
        var keyData = [];
        if (settings) {
            if (settings.difficulty) {
                keyData.push(settings.difficulty);
            }
            if (settings.dictionary) {
                keyData.push(settings.dictionary);
            }
        }
        keyData.push(key);
        return keyData.join('.');
    }


    function getGames(settings) {
        var key = getStorageKeyWithSettings('games', settings);
        var games = localStorage.getItem(key);
        if (!games) {
            return [];
        } else {
            try {
                games = JSON.parse(games);
                games.sort(function(g1, g2) {
                    return g2['score'] - g1['score'];
                })
                return games;
            } catch (e) {
                return [];
            }
        }
    }

    function saveGames(gamesArray, settings) {
        var key = getStorageKeyWithSettings('games', settings);
        localStorage.setItem(key, JSON.stringify(gamesArray));
    }

    function getSettings() {
        var settings = localStorage.getItem('settings');
        try {
            settings = JSON.parse(settings);
            return typeof settings == "object" && settings !== null ? settings : {};
        } catch (e) {
            return {};
        }
    }

    function saveSetting(name, value) {
        console.log('save setting', name, value);
        var settings = getSettings();
        settings[name] = value;
        localStorage.setItem('settings', JSON.stringify(settings));
    }

    function getSetting(name, def) {
        if (typeof def == "undefined") def = null;
        var settings = getSettings();
        return name in settings ? settings[name] : def;
    }


    return {
        addGameRecord: function(gameData) {
            var settings = getSettings();
            gameData['time'] = Date.now();
            var games = getGames(settings);
            games.push(gameData);
            saveGames(games, settings);
        },
        getGames: function() {
            var settings = getSettings();
            return getGames(settings);
        },
        getSetting: getSetting,
        saveSetting: saveSetting
    }
}());