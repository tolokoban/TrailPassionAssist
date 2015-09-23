var Widget = require("wdg");

/**
 * @param {object} opts
 * * {boolean} `simple`: Si `true`, le bouton ressemble à un simple lien.
 * * {string} `help`: Si défini, un click sur le bouton emmène vers la page d'aide dans l'onglet `HELP`.
 * * {object} `email`: Associe le _Tap_ à l'envoi d'un mail.
 *   * {string} `to`: destinataire.
 *   * {string} `subject`: sujet du mail.
 *   * {string} `body`: corps du mail.
 *
 * @example
 * var Button = require("tp4.button");
 * var instance = new Button();
 * @class Button
 */
var Button = function(opts) {
  Widget.call(this, {tag: "a"});
  this.addClass("tp4-button");
  var t = typeof opts;
  var that = this;
  if (t === 'string') opts = {caption: opts};
  else if (t !== 'object') opts = {};
  if (typeof opts.caption === 'undefined') opts.caption = "OK";
  if (opts.simple) {
    this.addClass("simple");
    this.text(opts.caption);
  } else {
    this.append(Widget.div().text(opts.caption));
  }
  if (typeof opts.enabled === 'undefined') opts.enabled = true;
  if (typeof opts.email === 'string') {
    opts.email = {to: opts.email};
  }
  if (typeof opts.email === 'object') {
    if (typeof opts.email.to !== 'string') {
      opts.email.to = "contact@trail-passion.net";
    }
    if (typeof opts.email.subject !== 'string') {
      opts.email.subject = "Trail-Passion";
    }
    if (typeof opts.email.body !== 'string') {
      opts.email.body = "";
    }
    var href =
      "mailto:" + opts.email.to
      + "?subject=" + encodeURIComponent(opts.email.subject)
      + "&body=" + encodeURIComponent(opts.email.body);
    console.info("[tp4.button] href=...", href);
    opts.href = href;
  }
  if (typeof opts.href === 'string') {
    that.attr("href", opts.href);
  }
  if (typeof opts.target === 'string') {
    that.attr("target", opts.target);
  }
  this.enabled(opts.enabled);
  if (typeof opts.help === 'string') {
    this.Tap(
      function() {
        open("http://help.trail-passion.net/" + opts.help, "HELP");
      }
    );
  }
};

Button.prototype = Object.create(Widget.prototype);
Button.prototype.constructor = Button;

/**
 * @return void
 */
Button.prototype.enabled = function(v) {
  if (typeof v === 'undefined') return this._enabled;
  this.attr("disabled", v ? "no" : "yes");
  this._enabled = v;
  return this;
};

/**
 * @return void
 */
Button.prototype.Tap = function(slot, sender) {
  if (typeof slot === 'undefined') return Widget.prototype.Tap.call(this);
  var that = this;
  if (typeof sender === 'undefined') sender = that;
  if (typeof slot === 'string') slot = sender[slot];
  var f = function() {
    if (that._enabled) {
      slot.call(sender, this);
    }
  };
  Widget.prototype.Tap.call(this, f);
  return this;
};

/**
 * @return void
 */
Button.prototype.fire = function() {
  var tap = this.Tap();
  if (!Array.isArray(tap)) return this;
  tap[0].call(tap[1], this);
  return this;
};

Button.create = function(opts) {
  return new Button(opts);
};
Button.createSimple = function(caption) {
  return new Button({caption: caption, simple: true});
};
module.exports = Button;
