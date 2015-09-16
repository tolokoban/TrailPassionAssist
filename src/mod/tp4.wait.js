var Widget = require("wdg");

/**
 * @param {object} opts
 * * {number} size: default 24.
 * * {string} color: default `#fff`.
 * * {string} caption: text aside.
 * @example
 * var Wait = require("tfw.modal");
 * var instance = new Wait();
 * @class Wait
 */
var Wait = function(opts) {
  Widget.call(this);
  this.addClass("tp4-wait");
  if (typeof opts === 'string') opts = {
    caption: opts
  };
  if (typeof opts !== 'object') {
    opts = {};
  }
  if (typeof opts.color !== 'string') opts.color = "#fff";
  if (typeof opts.size !== 'number') opts.size = 24;
  var svg = Widget.svg(
    "svg",
    {
      width: opts.size,
      height: opts.size,
      viewBox: "-32 -32 64 64"
    }
  ).css(
    {
      width: opts.size + "px",
      height: opts.size + "px"
    }
  );
  svg.append(
    Widget.svg(
      "g",
      {
        transform: "rotate(0)",
        "stroke-linecap": "round"
      }
    ).append(
      Widget.svg(
        "path",
        {
          stroke: "#000",
          opacity: .5,
          fill: "none",
          "stroke-width": 6,
          transform: "rotate(0)",
          d: "M0,24 A24,24,0,1,1,24,0"
        }
      ),
      Widget.svg(
        "path",
        {
          stroke: opts.color,
          fill: "none",
          "stroke-width": 4,
          transform: "rotate(0)",
          d: "M0,24 A24,24,0,1,1,24,0"
        }
      )
    ).append(
      Widget.svg(
        "animateTransform",
        {
          attributeName: "transform",
          begin: "0s",
          dur: "1s",
          type: "rotate",
          from: 0,
          to: 360,
          repeatCount: "indefinite"
        }
      )
    )
  );
  this.append(svg);
  if (typeof opts.caption === 'string') {
    this.text(opts.caption);
  }
};

Wait.prototype = Object.create(Widget.prototype);
Wait.prototype.constructor = Wait;

function hasText(v) {
  if (typeof v === 'string') {
    if (!this._text) {
      this._text = Widget.div();
      this.append(this._text);
    }
    return true;
  } else {
    if (this._text) {
      this._text.detach();
    }
    return false;
  }
}

/**
 * @return void
 */
Wait.prototype.text = function(v) {
  if (hasText.call(this, v)) {
    this._text.text(v);
  }
  return this;
};

/**
 * @return void
 */
Wait.prototype.html = function(v) {
  if (hasText.call(this, v)) {
    this._text.html(v);
  }
  return this;
};

Wait.create = function(opts) {
  return new Wait(opts);
};
module.exports = Wait;
