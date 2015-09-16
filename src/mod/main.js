var WS = require("tfw.web-service");
var Hash = require("tfw.hash-watcher");
var Storage = require("tfw.storage").local;

var TraceTools = require("tp4.trace-tools");


WS.config('url', 'http:trail-passion.net/tfw');

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
                }
            );
        }, 300);
    });
};


function sendSMS(message) {
    if ('MozActivity' in window) {
        var sms = new MozActivity({
            name: "new",
            data: {
                type: "websms/sms",
                number: document.getElementById('sms').$ctrl.val(),
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
        alert(message);
    }
}
