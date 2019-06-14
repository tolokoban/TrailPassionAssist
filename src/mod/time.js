var Modal = require("tfw.modal");
var LG = require("tfw.layout-grid").create;
var D = require("wdg").div;
var B = require("tp4.button").create;

function formatDate(ms) {
    if (ms === 0) return "--:--";
    if (typeof ms === 'undefined') ms = Date.now();
    var date = new Date(ms),
        mm = date.getMinutes(),
        hh = date.getHours();
    if (mm < 10) {
        mm = "0" + mm;
    }
    if (hh < 10) {
        hh = "0" + hh;
    }
    return hh + ":" + mm;
}


module.exports = function(title, slot) {
    var modal = new Modal({title: title}),
        tim = new Date(),
        wdgTime = D('time'),
        wdgDate = D('date'),
        refresh = function () {
            wdgTime.text(formatDate(tim));
            wdgDate.text(tim.toLocaleDateString());
        };
    var btnA1h = B('+1H').Tap(function () {
        tim.setHours(tim.getHours() + 1);
        refresh();
    });
    var btnA10h = B('+10H').Tap(function () {
        tim.setHours(tim.getHours() + 10);
        refresh();
    });
    var btnA1m = B('+1m').Tap(function () {
        tim.setMinutes(tim.getMinutes() + 1);
        refresh();
    });
    var btnA10m = B('+10m').Tap(function () {
        tim.setMinutes(tim.getMinutes() + 10);
        refresh();
    });
    var btnS1h = B('-1H').Tap(function () {
        tim.setHours(tim.getHours() - 1);
        refresh();
    });
    var btnS10h = B('-10H').Tap(function () {
        tim.setHours(tim.getHours() - 10);
        refresh();
    });
    var btnS1m = B('-1m').Tap(function () {
        tim.setMinutes(tim.getMinutes() - 1);
        refresh();
    });
    var btnS10m = B('-10m').Tap(function () {
        tim.setMinutes(tim.getMinutes() - 10);
        refresh();
    });

    modal.append(
        LG([btnA10h, btnA1h, ' ', btnA10m, btnA1m]).addClass('wide'),
        wdgTime,
        LG([btnS10h, btnS1h, ' ', btnS10m, btnS1m]).addClass('wide'),
        wdgDate,
        B(_('validate')).Tap(function () {
            modal.hide();
            slot(tim.getTime());
        })
    );
    refresh();
    modal.show();
};


module.exports.format = formatDate;
