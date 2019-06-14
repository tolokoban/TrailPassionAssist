var WS = require("tfw.web-service");
var Time = require("time");
var Hash = require("tfw.hash-watcher");
var Widget = require("wdg");
var Storage = require("tfw.storage").local;
var TraceTools = require("tp4.trace-tools");

var LG = require("tfw.layout-grid").create;
var D = Widget.div;
var T = Widget.tag;

WS.config('url', 'http://trail-passion.net/tfw');


var book = null;

function showPage(pageID) {
    if (!book) {
        book = document.getElementById('BOOK').$ctrl;
    }
    return book.show(pageID);
}


Hash(function () {
    var hashes = Hash.hash().split(';');
    hashes.forEach(function (hash) {
        var page;
        if (hash.substr(0, 6) == '/book/') {
            page = hash.substr(6);
            showPage(page);
            refresh();
        }
    });
});


exports.start = function() {
    refresh();
    require("search")('search', function (traceId, traceName) {
        document.getElementById('trace-loading').textContent = traceName;
        location = "#/book/loading";
        setTimeout(function () {
            WS.get("tp3.Load", traceId).then(
                function (data) {
                    data = TraceTools.normalize(data);
                    location = "#/book/welcome";
                    var k;
                    var dis = TraceTools.getPseudoDis(data);
                    var alt = TraceTools.computeAscDsc(data);
                    var markers = [];
                    data.text.forEach(function (mrk) {
                        if (mrk.img && mrk.img.length > 0) {
                            for (k = 0; k < 4; k++) {
                                if (mrk.img.indexOf('LSGC'.charAt(k)) > -1) {
                                    markers.push(mrk);
                                    break;
                                }
                            }
                        }
                    });
                    if (markers.length == 0 || markers[0].idx > 0) {
                        markers.unshift({idx: 0, txt: "Start"});
                    }
                    if (markers[markers.length - 1].idx < data.lat.length - 1) {
                        markers.push({idx: data.lat.length - 1, txt: "End"});
                    }
                    markers.forEach(function (mrk) {
                        mrk.dis = dis[mrk.idx];
                        mrk.km = Math.floor(parseInt(data.dis[mrk.idx]) / 100) / 10;
                        mrk.asc = Math.floor(.5 + alt.asc[mrk.idx]);
                        mrk.dsc = Math.floor(.5 + alt.dsc[mrk.idx]);
                        delete mrk.pau;
                        delete mrk.stp;
                        delete mrk.typ;
                        delete mrk.idx;
                        delete mrk.img;
                    });
                    data = {
                        text: markers,
                        name: data.name,
                        km: parseInt(data.km),
                        asc: parseInt(data.asc),
                        dsc: parseInt(data.dsc)
                    };
                    console.log(data);
                    Storage.set("tpa.trace", data);
                    Storage.set("tpa.step", 0);
                },
                function (err) {
                    console.error(err);
                    alert(err.err);
                }
            );
        }, 300);
    });
};


function refresh() {
    var data = Storage.get("tpa.trace", null);
    if (!data) return;

    var step = parseInt(Storage.get("tpa.step", 0));
    document.getElementById('trace-name').textContent = data.name;
    var board = new Widget({id: 'dashboard'}),
        btnSMS = T('a').text(_('send_sms')),
        btnTime = T('a').text(_('adjust_time'));

    btnSMS.Tap(function () {
        setStep(step);
        var steps = getSteps(),
            msg = '';
        steps.forEach(function (mrk, idx, arr) {
            if (idx > 0) {
                var previousMarker = arr[idx - 1];
                msg += ''
                    + (mrk.km - previousMarker.km).toFixed(1) + " km"
                    + ' +' + Math.floor(mrk.asc - previousMarker.asc)
                    + ' -' + Math.floor(mrk.dsc - previousMarker.dsc) + "\n";
            }
            msg += mrk.tim + ' ' + mrk.txt + "\n";
        });
        step++;
        Storage.set('tpa.step', step);
        sendSMS(msg);
        refresh();
    });

    btnTime.Tap(function () {
        Time(data.text[step].txt, function (ms) {
console.info("[main] ms=...", ms);
            setStep(step, ms);
            refresh();
        });
    });

    var btnPrev = T('a').text("◀");
    var btnNext = T('a').text("▶");
    if (step == 0) {
        btnPrev.attr("disabled", "true");
    } else {
        btnPrev.Tap(function () {
            step--;
            Storage.set("tpa.step", step);
            refresh();
        });
    }
    if (step >= data.text.length - 2) {
        btnNext.attr("disabled", "true");
    } else {
        btnNext.Tap(function () {
            step++;
            Storage.set("tpa.step", step);
            refresh();
        });
    }
    board.clear(LG([btnPrev, btnNext]).addClass("wide").css("margin-bottom", "1rem"));

    getSteps().forEach(function (mrk, idx, arr) {
        if (idx > 0) {
            var previousMarker = arr[idx - 1];
            board.append(
                D('step').text(
                    (mrk.km - previousMarker.km).toFixed(1) + " km, "
                        + Math.floor(mrk.asc - previousMarker.asc) + " D+, "
                        + Math.floor(mrk.dsc - previousMarker.dsc) + " D-")
            );
        }
        board.append(
            D('marker').append(
                D().text(mrk.tim),
                D().text(mrk.txt)
            )
        );
    });

    board.append(
        LG([btnSMS, btnTime]).css("width", "100%").styles({
            R: "center"
        }).css("margin-top", "1rem")
    );
}

function setStep(step, ms) {
    var data = Storage.get("tpa.trace", null);
    if (!data) return;
    var markers = data.text;
    if (typeof ms === 'undefined') {
        if (markers[step].tim) return;
        ms = Date.now();
    }
    markers[step].tim = ms;
    step++;
    while (step < markers.length) {
        delete markers[step].tim;
        step++;
    }
    Storage.set("tpa.trace", data);
}

function getSteps() {
    var data = Storage.get("tpa.trace", null);
    if (!data) return [];
    var step = parseInt(Storage.get("tpa.step", 0)),
        lastStep = step + 3,
        result = [],
        mrk,
        tim;
    document.getElementById('trace-name').textContent = data.name;
    while (step < Math.min(lastStep + 1, data.text.length)) {
        mrk = data.text[step];
        tim = mrk.tim || 0;
        if (tim == 0) {
            tim = estimateTime(data.text, step);
        }
        result.push(
            {
                txt: mrk.txt,
                km: mrk.km,
                asc: mrk.asc,
                dsc: mrk.dsc,
                tim: Time.format(tim)
            }
        );
        step++;
    }
    return result;
}

function estimateTime(markers, step) {
    if (step < 2) return 0;
    if (markers[step].tim) return markers[step].tim;
    var tim0 = markers[0].tim || 0,
        tim1 = 0,
        dis1 = 0,
        tim,
        dis = 0,
        idx,
        mrk,
        speed;
    for (idx = 1; idx <= step; idx++) {
        mrk = markers[idx];
        tim = mrk.tim || 0;
        dis = mrk.dis;
        if (tim != 0) {
            tim1 = tim;
            dis1 = dis;
        }
    }
    if (dis < 0.1) return 0;
    if (dis1 < 0.1) return 0;
    if (tim1 < 0.1) return 0;
    speed = dis1 / (tim1 - tim0);
    return tim0 + dis / speed;
}


function sendSMS(message) {
    var smsNumber = Storage.get("tpa.sms", "");
    if ('MozActivity' in window) {
        var sms = new MozActivity({
            name: "new",
            data: {
                type: "websms/sms",
                number: smsNumber,
                body: message
            }
        });
        sms.onerror = function(err) {
            console.error(err);
            alert("Failed to send the SMS!\n" + err);
        };
        sms.onsuccess = function() {
            console.info("Success", this);
        };
    } else {
        alert(smsNumber + "\n\n" + message);
    }
}


