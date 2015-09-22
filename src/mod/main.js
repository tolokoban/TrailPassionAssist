var WS = require("tfw.web-service");
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
        if (hash.substr(0, 6) == '/book/') {
            showPage(hash.substr(6));
        }
    });
});


exports.start = function() {
    setInterval(refresh, 59000);
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
                                if (mrk.img.indexOf('LSGC'.charAt(k))) {
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
    mrk1 = data.text[step],
    mrk2 = data.text[step + 1],
    now = Date.now(),
    tim1 = formatDate(now),
    tim2 = '--:--',
    btnSMS = T('a').text(_('send_sms'));

    btnSMS.Tap(function () {
        sendSMS(
            tim1 + " - " + mrk1.txt + "\n"
            + tim2 + " - " + mrk2.txt
        );
    });
    
console.info("[main] mrk1=...", mrk1);
console.info("[main] mrk2=...", mrk2);

    board.clear(
        D('marker').append(
            D().text(tim1),
            D().text(mrk1.txt)
        ),
        D('marker').append(
            D().text(tim2),
            D().text(mrk2.txt)
        ),
        D('step').text((mrk2.km - mrk1.km).toFixed(1) + " km, "
                      + Math.floor(mrk2.asc - mrk1.asc) + " D+, "
                      + Math.floor(mrk2.dsc - mrk1.dsc) + " D-"),
        LG([btnSMS])
    );
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


function formatDate(ms) {
    if (typeof ms === 'undefined') ms = Date.now();
    var date = new Date(ms),
    mm = date.getMinutes(),
    hh = date.getHours();
    if (mm < 10) {
        mm = "0" + mm;
    }
    return hh + ":" + mm;
}
