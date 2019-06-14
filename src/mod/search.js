var Widget = require("wdg");
var Timer = require("tfw.timer");
var Wait = require("tp4.wait").create;
var WS = require("tfw.web-service");

var D = Widget.div;

/**
 *
 */
module.exports = function(id, slot) {
    var update = false,
        timer = 0,
        input = document.getElementById(id).$ctrl,
        result = D("tpa-search-result").insertAfter(input),
        action = Timer.laterAction(function () {
            result.clear(Wait());
            WS.get("tp4.ListTraces", {modes: 'all', limit: 8, name: input.val()}).then(
                function (data) {
                    var traces = data.all;
                    result.clear();
                    traces.I.forEach(function (id, index) {
                        var item = D("tpa-search-result-item");
                        item.append(
                            D().text(traces.N[index]),
                            D().text(
                                traces.K[index] + " km, "
                                + traces.A[index] + " D+, "
                                + traces.D[index] + " D-"
                            )
                        );
                        addTap(item, id, traces.N[index], slot);
                        result.append(item);
                    });
                },
                function (err) {
                    console.error(err);
                    result.clear(D("tpa-error").text(err.err));
                }
            );
        }, 300);
    input.Enter(function () {
        action.fire();
    });
};


function addTap(item, id, name, slot) {
    item.Tap(function () {
        slot(id, name);
    });
}
