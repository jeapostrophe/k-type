window.rStorage = (function () {
    function getGames() {
        var games = localStorage.getItem('games');
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

    function saveGames(gamesArray) {
        localStorage.setItem('games', JSON.stringify(gamesArray));
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
            gameData['time'] = Date.now();
            var games = getGames();
            games.push(gameData);
            saveGames(games);
        },
        getGames: getGames,
        getSetting: getSetting,
        saveSetting: saveSetting
    }
}());