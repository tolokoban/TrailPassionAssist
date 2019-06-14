var KEYS_ARRAY = ['lat', 'lng', 'alt', 'tim', 'dis'];


exports.normalize = function(data) {
    if (Array.isArray(data.text)) {
        // Trier les ravitos.
        data.text.forEach(function (mrk) {
            mrk.idx = parseInt(mrk.idx);
        });
        data.text = data.text.sort(
            function(a,b) {
                if (parseInt(a.idx) > parseInt(b.idx)) return 1;
                if (parseInt(a.idx) < parseInt(b.idx)) return -1;
                return 0;
            }
        );
    } else {
        data.text = [];
    }
    return data;
};


exports.bounds = function(data) {
    var b = {e: -180, w: 180, n: -90, s: 90, altMin: 10000, altMax: -10000};
    var lat, lng, alt;
    for (var i = 0 ; i < data.lat.length ; i++) {
        lat = data.lat[i];
        lng = data.lng[i];
        alt = data.alt[i];
        b.n = Math.max(b.n, lat);
        b.s = Math.min(b.s, lat);
        b.e = Math.max(b.e, lng);
        b.w = Math.min(b.w, lng);
        b.altMax = Math.max(b.altMax, alt);
        b.altMin = Math.min(b.altMin, alt);
    }
    return b;
};

/**
 * Default threshold is 3.
 * @param {object} data `data = {alt: [4521, ...], threshold: 3}`
 * @return {object} `{asc: [100, 125, 155, ...], dsc: [...]}`
 */
exports.computeAscDsc = function(data, a, b) {
    var d = data;
    var result = {
        asc: [], dsc: []
    };
    if (a === undefined) a = 0;
    if (a < 0) a = 0;
    if (b === undefined) b = d.alt.length - 1;
    if (b >= d.alt.length) b = d.alt.length - 1;
    if (a >= b) return result;
    var threshold = parseInt(data.thr);
    if (typeof threshold === 'undefined' || isNaN(threshold)) threshold = 3;
    var alt = d.alt[a], asc = 0, dsc = 0;
    result.asc.push(0);
    result.dsc.push(0);
    for (var i = a + 1 ; i < b + 1 ; i++) {
        var cur = d.alt[i];
        var delta = cur - alt;
        if (delta > threshold) {
            // Montée détectée.
            asc += delta;
            alt = cur;
        }
        else if (delta < -threshold) {
            // Descente détectée.
            dsc -= delta;
            alt = cur;
        }
        result.asc.push(asc);
        result.dsc.push(dsc);
    }
    return result;
};

/**
 * Reverse a  trace. The start becomes  the end and the  end becomes the
 * start.
 */
exports.reverse = function(data) {
    KEYS_ARRAY.forEach(function (key) {
        var arr = data[key];
        if (Array.isArray(arr)) {
            arr.reverse();
        }
    });
    var tmp = data.asc;
    data.asc = data.dsc;
    data.dsc = tmp;
    var size = data.lat.length - 1;
    if (Array.isArray(data.text)) {
        data.text.forEach(function (mrk) {
            var idx = size - parseInt(mrk.idx);
            mrk.idx = idx;
        });
    }
    return data;
};

/**
 * Add `data2` to the end of `data1`.
 */
exports.concat = function(data1, data2) {
    var size = data1.lat.length;
    KEYS_ARRAY.forEach(function (key) {
        var arr1 = data1[key],
        arr2 = data2[key];
        if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
            delete data1[key];
            delete data2[key];
        } else {
            arr2.forEach(function (itm) {
                arr1.push(itm);
            });

        }
    });
    if (!Array.isArray(data1.text)) {
        data1.text = [];
    }
    if (Array.isArray(data2.text)) {
        data2.text.forEach(function (mrk) {
            mrk = JSON.parse(JSON.stringify(mrk));
            var idx = size + parseInt(mrk.idx);
            mrk.idx = idx;
            data1.text.push(mrk);
        });
    }
    ['km', 'asc', 'dsc'].forEach(function (key) {
        var arr1 = data1[key],
        arr2 = data2[key];
        if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
            delete data1[key];
            delete data2[key];
        } else {
            data1[key] = parseInt(data1[key]) + parseInt(data2[key]);
        }        
    });

    return data1;
};

/**
 * Shallow copy of a trace.
 */
exports.copy = function(data) {
    return JSON.parse(JSON.stringify(data));
};

/**
 * Calcule la vitesse de course sur la portion montante [a, b] de la trace.
 * @memberof tp3.CalculTempsPassage
 * @private
 */
var speedUp = function(data, speeds, a, b) {
    var dis = data.dis;
    var alt = data.alt;
    var m = dis[b] - dis[a]; // Taille du tronçon en mètres.
    var d = alt[b] - alt[a]; // Dénivelé du tronçon.
    var x = parseFloat(d) / parseFloat(m);
    var s = 8;   // 8 km/h sur le plat.
    if (x > .08) {
        // Il ne s'agit plus de plat.
        // Une pente de 0.27 équivaut à la montée de Grande-Gorge
        // et il faut compter 3 km/h.
        s = 8 + (3 - 8) * (x - .08) / (0.27 - .08);
    }
    if (s < 2.6) s = 2.6;   // Vitesse minimale.
    speeds.push(s);
};

/**
 * Calcule la vitesse de course sur la portion Descendante [a, b] de la trace.
 * @memberof tp3.CalculTempsPassage
 * @private
 */
var speedDown = function(data, speeds, a, b) {
    var dis = data.dis;
    var alt = data.alt;
    var m = dis[b] - dis[a]; // Taille du tronçon en mètres.
    var d = alt[a] - alt[b]; // Dénivelé du tronçon.
    var x = parseFloat(d) / parseFloat(m);
    var s = 8;   // 8 km/h sur le plat.
    if (x > .08) {
        // Il ne s'agit plus de plat.
        if (x < .12) {
            // Jusqu'à une pente de 0.12, on accélère pour atteindre 13 km/h.
            s = 8 + (13 - 8) * (x - .08) / (0.12 - .08);
        } else {
            // Une pente de 0.22 équivaut à la descente d'Orjobet
            // et il faut compter 8 km/h.
            s = 13 + (8 - 13) * (x - .12) / (0.22 - .12);
        }
    }
    if (s < 3) s = 3;   // Vitesse minimale.
    speeds.push(s);
};


/**
 * @param {object} data Must contain the following attributes:
 * * {array} lat: Latitudes.
 * * {array} lng: Longitudes.
 * * {array} alt: Altitudes.
 * @return {object} relative speeds by steps. `{steps: [], speeds: []}`
 * * __steps__: Each item is a step and it is represented by the index of the last point of this step.
 * * __speeds__: Array of same length as `steps`. Relative speed of each step.
 */
function computeSpeedsByStep(data) {
    var speeds = [];

    // On considère des étapes par seuils de 20 mètres de dénivelé.
    // C'est pour calculer les pentes sur des portions assez grandes.
    var threshold = 20;
    var lastAlt = data.alt[0];
    var lastIdx = 0;
    var totalDis = data.dis[data.dis.length - 1] - data.dis[0];
    var lastDis;
    var totalAltUp = 0;
    var totalDisUp = 0;
    var totalAltDn = 0;
    var totalDisDn = 0;
    var steps = [];
    var i, k, a, d, z;
    var idx, speed;
    var base, factor, pauses;
    var idxTxt, begin, end;
    for (i in data.dis) {
        d = parseInt(data.dis[i]);
        a = parseInt(data.alt[i]);
        z = a - lastAlt;
        if (z > threshold) {
            // Dénivelé positif.
            speedUp(data, speeds, lastIdx, i);
            totalAltUp += z;
            totalDisUp += d - data.dis[lastIdx];
            lastIdx = i;
            lastAlt = a;
            steps.push(parseInt(i));
        }
        else if (-z > threshold) {
            // Dénivelé négatif.
            speedDown(data, speeds, lastIdx, i);
            totalAltDn -= z;
            totalDisDn += d - data.dis[lastIdx];
            lastIdx = i;
            lastAlt = a;
            steps.push(parseInt(i));
        }
    }
    // Dernier tronçon.
    if (z > 0) {
        // Dénivelé positif.
        speedUp(data, speeds, lastIdx, data.dis.length - 1);
        totalAltUp += z;
        totalDisUp += d - data.dis[lastIdx];
        steps.push(data.dis.length - 1);
    }
    else if (z <= 0) {
        // Dénivelé négatif.
        speedDown(data, speeds, lastIdx, data.dis.length - 1);
        totalAltDn -= z;
        totalDisDn += d - data.dis[lastIdx];
        steps.push(data.dis.length - 1);
    }

    return {steps: steps, speeds: speeds};
}


/**
 * Convert  kilometers in  pseudo-kilometers. A  km in  a big  ascending
 * slope gives a greater pseudo-km.
 *
 * @param {object} data Must contain the following attributes:
 * * {array} lat: Latitudes.
 * * {array} lng: Longitudes.
 * * {array} alt: Altitudes.
 */
function getPseudoDis(data) {
    var dis = [0];
    var speedsByStep = computeSpeedsByStep(data);
    var steps = speedsByStep.steps;
    var speeds = speedsByStep.speeds;

    var lastIdx = 0;
    steps.forEach(
        function(idx, i) {
            // Vitesse sur le tronçon.
            var speed = speeds[i];
            // Appliquer des temps théoriques.
            var k = lastIdx + 1;
            while (k <= idx) {
                dis.push(
                    dis[lastIdx]
                        + (
                            (parseInt(data.dis[k])
                             - parseInt(data.dis[lastIdx])) / speed
                        )
                );
                k++;
            }
            lastIdx = idx;
        }
    );
    return dis;
}

exports.getPseudoDis = getPseudoDis;

/**
 * @param {object} data Must contain the following attributes:
 * * {array} lat: Latitudes.
 * * {array} lng: Longitudes.
 * * {array} alt: Altitudes.
 * @param {number} start Start time in minutes from midnight.
 * @param {number} duration Duration in minutes.
 * @param {number} tireness Percent from -99 to 100.
 */
exports.computeTimes = function(data, start, duration, tireness) {
    var tim = [0];   // Resulting array of times expressed in seconds;

    var pause = 0;  // Total pausing time in minutes.
    var item;
    if (data.text) {
        // Ajouter les éventuels temps de pause pour chaque ravito.
        // Ces temps de pause sont exprimés en minutes.
        for (i in data.text) {
            item = data.text[i];
            if (item.pau) {
                pause += parseInt(item.pau);
            }
        }
        duration -= pause;
    }
    tireness = tireness / 100;

    // Recalculer les distances pour être sûr.
    var lastLat = data.lat[0];
    var lastLng = data.lng[0];
    if (!data.dis) {
        // Pas de distance, alors on la calcule.
        data.dis = [0];
        var dis = 0;
        for (i=1 ; i<data.lat.length ; i++) {
            var lat = data.lat[i], lng = data.lng[i];
            dis += exports.distance(lastLat, lastLng, lat, lng);
            data.dis.push(dis);
            lastLat = lat;
            lastLng = lng;
        }
    }

    var speedsByStep = computeSpeedsByStep(data);
    var steps = speedsByStep.steps;
    var speeds = speedsByStep.speeds;
    var lastDis = data.dis[0];
    var lastAlt = data.alt[0];
    var begin, end;
    var i, k, idx, speed;
    var base, factor, idxTxt, pauses;
    var totalDis = data.dis[data.dis.length - 1] - data.dis[0];
    var lastIdx = 0;
    steps.forEach(
        function(idx, i) {
            // Vitesse sur le tronçon.
            speed = speeds[i];
            // Calcul de la fatigue.
            speed *= 1 - (tireness * data.dis[idx] / totalDis);
            // Appliquer des temps théoriques.
            k = lastIdx + 1;
            while (k <= idx) {
                tim.push(tim[lastIdx]
                         + Math.ceil((parseInt(data.dis[k])
                                      - parseInt(data.dis[lastIdx])) / speed));
                k++;
            }
            lastIdx = idx;
        }
    );

    // Maintenant on dilate/contracte pour obtenir le temps voulu.
    base = start * 60;
    factor = (duration * 60) / tim[tim.length - 1];

    for (i=0 ; i<tim.length ; i++) {
        tim[i] = base + Math.floor(factor * tim[i]);
    }

    // Pour finir, il faut insérer les temps de pause.
    idxTxt = 0;
    pauses = [];
    pause = 0;
    for (idxTxt in data.text) {
        item = data.text[idxTxt];
        if (item.pau) {
            pause += parseInt(item.pau) * 60;
            pauses.push([item.idx + 1, pause]);
        }
    }
    if (pauses.length > 0) {
        pauses.push([tim.length]);
        for (idxTxt=0 ; idxTxt<pauses.length-1 ; idxTxt++) {
            begin = pauses[idxTxt];
            end = pauses[idxTxt + 1];
            for (i=begin[0] ; i<end[0] ; i++) {
                tim[i] += begin[1];
            }
        }
    }

    return tim;
};

/**
 * Calcule la distance en mètres entre deux points
 * dont on donne les coordonnées latitude/longitude
 * en argument.
 */
exports.distance = function(lat1, lng1, lat2, lng2) {
    var R = 6371; // Rayon moyen de la terre en km.
    var dLat  = Math.PI*(lat2 - lat1)/180;
    var dLong = Math.PI*(lng2 - lng1)/180;

    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(Math.PI*(lat1)/180)
        * Math.cos(Math.PI*(lat2)/180)
        * Math.sin(dLong/2)
        * Math.sin(dLong/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = Math.floor((R * c)*1000);
    return d;
};

/**
 * There are common and custom icons.
 * Custom icons are represented by a lowercase letter.
 */
exports.mrkImgSrc = function(data, code) {
    var icons = data.icons;
    if (code >= 'a' && code < 'k') {
        if (!Array.isArray(icons)) return null;
        return "data:image/png;base64," + icons[code.charCodeAt(0) - "a".charCodeAt(0)];
    } else {
        return "css/gfx/ravitos/mrk-" + code + ".png";
    }
};
