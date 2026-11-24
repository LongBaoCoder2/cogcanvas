(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Routing plate ─────────────────────────────────── */
  function initPlate() {
    var plate = document.querySelector(".plate");
    if (!plate) return;
    var stage = plate.querySelector(".stage");
    var imgs = stage.querySelectorAll(".frame img");
    var stepBtns = plate.querySelectorAll(".steps button");
    var subjects = plate.querySelectorAll(".subject");

    function showStep(step) {
      stepBtns.forEach(function (b) {
        var on = b.dataset.step === step;
        b.setAttribute("aria-selected", on ? "true" : "false");
        b.tabIndex = on ? 0 : -1;
      });
      imgs.forEach(function (im) { im.classList.toggle("on", im.dataset.step === step); });
      stage.dataset.masks = step === "route" ? "on" : "off";
      stage.dataset.step = step;
    }

    stepBtns.forEach(function (b, i) {
      b.addEventListener("click", function () { showStep(b.dataset.step); });
      b.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var next = stepBtns[(i + d + stepBtns.length) % stepBtns.length];
        next.focus();
        showStep(next.dataset.step);
      });
    });

    var graph = plate.querySelector(".graph");
    function focusSubject(s) {
      [stage, graph].forEach(function (n) {
        if (!n) return;
        if (s) n.dataset.focus = s; else delete n.dataset.focus;
      });
      subjects.forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.s === s ? "true" : "false"); });
    }
    var pinned = null;
    subjects.forEach(function (b) {
      b.addEventListener("mouseenter", function () { if (!pinned) focusSubject(b.dataset.s); });
      b.addEventListener("mouseleave", function () { if (!pinned) focusSubject(null); });
      b.addEventListener("focus", function () { if (!pinned) focusSubject(b.dataset.s); });
      b.addEventListener("blur", function () { if (!pinned) focusSubject(null); });
      b.addEventListener("click", function () {
        pinned = pinned === b.dataset.s ? null : b.dataset.s;
        focusSubject(pinned);
        if (pinned && stage.dataset.step === "layout") showStep("route");
      });
    });

    showStep("route");
    if (!reduceMotion) {
      plate.classList.add("intro");
      setTimeout(function () { plate.classList.remove("intro"); }, 1000);
    }
  }

  /* ── Collapse chart ────────────────────────────────── */
  var SVGNS = "http://www.w3.org/2000/svg";
  function el(name, attrs, parent) {
    var n = document.createElementNS(SVGNS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function initChart() {
    var svg = document.getElementById("collapse-chart");
    var legend = document.getElementById("collapse-legend");
    var data = window.C2C_DATA;
    if (!svg || !legend || !data) return;

    var W = 640, H = 360, m = { l: 44, r: 20, t: 30, b: 44 };
    function size() {
      var w = svg.parentNode.clientWidth - 40;
      W = Math.max(300, Math.min(640, w));
      H = W < 480 ? Math.round(W * 0.8) : 360;
    }
    var yMax = { attrvqa: 70, id: 60, dino: 40 };
    var metric = "attrvqa";
    var order = ["ours", "control", "published"];
    var sorted = data.methods.slice().sort(function (a, b) { return order.indexOf(a.kind) - order.indexOf(b.kind); });

    function x(i) { return m.l + (i * (W - m.l - m.r)) / (data.groups.length - 1); }
    function y(v) { return H - m.b - (v / yMax[metric]) * (H - m.t - m.b); }

    function setFocus(key) {
      svg.classList.toggle("has-focus", !!key);
      svg.querySelectorAll(".series").forEach(function (g) { g.classList.toggle("focus", g.dataset.key === key); });
      legend.querySelectorAll("button").forEach(function (b) { b.classList.toggle("focus", b.dataset.key === key); });
    }

    function draw() {
      size();
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      var label = data.metricLabels[metric];
      svg.setAttribute("aria-label", label + " by number of subjects, N = 2 to 5, for eight methods. Context2Canvas falls from " +
        data.perN[metric].ours[0] + " to " + data.perN[metric].ours[3] + ".");

      var step = yMax[metric] / 7 >= 10 ? 10 : 5;
      for (var v = 0; v <= yMax[metric]; v += step) {
        el("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: "grid" }, svg);
        var t = el("text", { x: m.l - 8, y: y(v) + 4, "text-anchor": "end" }, svg);
        t.textContent = v;
      }
      data.groups.forEach(function (n, i) {
        var t = el("text", { x: x(i), y: H - m.b + 22, "text-anchor": "middle" }, svg);
        t.textContent = "N = " + n;
      });

      // Draw published first so ours sits on top.
      sorted.slice().reverse().forEach(function (meth) {
        var vals = data.perN[metric][meth.key];
        var g = el("g", { class: "series", "data-key": meth.key }, svg);
        var d = vals.map(function (v, i) { return (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1); }).join(" ");
        el("path", { d: d, class: "line " + meth.kind }, g);
        vals.forEach(function (v, i) {
          el("circle", { cx: x(i), cy: y(v), r: meth.kind === "ours" ? 4.5 : 3, class: "dot " + meth.kind }, g);
          if (meth.kind === "ours") {
            var t = el("text", { x: x(i) + (i === 0 ? 8 : i === 3 ? -8 : 0), y: y(v) - 12, "text-anchor": i === 0 ? "start" : i === 3 ? "end" : "middle", class: "val" }, g);
            t.textContent = v.toFixed(1);
          }
        });
        var title = el("title", {}, g);
        title.textContent = meth.name + ": " + vals.join(", ");
      });

      // Legend
      legend.innerHTML = "";
      var groupNames = { ours: "", control: "Training-free controls on our backbone", published: "Published generators" };
      var lastKind = null;
      sorted.forEach(function (meth) {
        if (meth.kind !== lastKind && groupNames[meth.kind]) {
          var gl = document.createElement("li");
          gl.className = "group";
          gl.textContent = groupNames[meth.kind];
          legend.appendChild(gl);
        }
        lastKind = meth.kind;
        var vals = data.perN[metric][meth.key];
        var li = document.createElement("li");
        var b = document.createElement("button");
        b.type = "button";
        b.dataset.key = meth.key;
        var dash = meth.kind === "published" ? ' stroke-dasharray="4 4"' : "";
        var color = meth.kind === "ours" ? "var(--ink)" : meth.kind === "control" ? "var(--ink-2)" : "var(--ink-3)";
        var w = meth.kind === "ours" ? 3.5 : 2;
        b.innerHTML = '<svg viewBox="0 0 22 8" aria-hidden="true"><line x1="0" y1="4" x2="22" y2="4" stroke="' + color + '" stroke-width="' + w + '"' + dash + '/></svg>' +
          "<span>" + meth.name + "</span>" +
          '<span class="from">' + vals[0].toFixed(1) + " →</span>" +
          '<span class="to">' + vals[3].toFixed(1) + "</span>";
        b.setAttribute("aria-label", meth.name + ", " + label + " " + vals[0] + " at N = 2, " + vals[3] + " at N = 5");
        b.addEventListener("mouseenter", function () { setFocus(meth.key); });
        b.addEventListener("mouseleave", function () { setFocus(null); });
        b.addEventListener("focus", function () { setFocus(meth.key); });
        b.addEventListener("blur", function () { setFocus(null); });
        li.appendChild(b);
        legend.appendChild(li);
      });
      document.querySelectorAll("[data-metric-name]").forEach(function (n) { n.textContent = label; });
    }

    document.querySelectorAll(".metric-switch button").forEach(function (b) {
      b.addEventListener("click", function () {
        metric = b.dataset.metric;
        document.querySelectorAll(".metric-switch button").forEach(function (o) {
          o.setAttribute("aria-pressed", o === b ? "true" : "false");
        });
        draw();
      });
    });
    draw();
    var lastW = W, t;
    window.addEventListener("resize", function () {
      clearTimeout(t);
      t = setTimeout(function () { size(); if (W !== lastW) { lastW = W; draw(); } }, 120);
    });
  }

  /* ── Panel tabs (each tablist on its own) ─────────── */
  function initTabs() {
    document.querySelectorAll(".tabs[role=tablist]").forEach(function (list) {
      var tabs = Array.prototype.slice.call(list.querySelectorAll("[role=tab][aria-controls]"));
      if (!tabs.length) return;
      function select(t) {
        tabs.forEach(function (o) {
          var on = o === t;
          o.setAttribute("aria-selected", on ? "true" : "false");
          o.tabIndex = on ? 0 : -1;
          document.getElementById(o.getAttribute("aria-controls")).hidden = !on;
        });
      }
      tabs.forEach(function (t, i) {
        t.addEventListener("click", function () { select(t); });
        t.addEventListener("keydown", function (e) {
          var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
          if (!d) return;
          e.preventDefault();
          var n = tabs[(i + d + tabs.length) % tabs.length];
          n.focus();
          select(n);
        });
      });
    });
  }

  /* ── Stage figure reveal ───────────────────────────── */
  function initReveal() {
    var btns = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    function label(b, open) {
      b.textContent = b.textContent.replace(/^(Show|Hide)/, open ? "Hide" : "Show");
    }
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        var open = b.getAttribute("aria-expanded") !== "true";
        btns.forEach(function (o) {
          var on = o === b && open;
          o.setAttribute("aria-expanded", on ? "true" : "false");
          document.getElementById(o.getAttribute("aria-controls")).hidden = !on;
          label(o, on);
        });
        if (open) {
          var panel = document.getElementById(b.getAttribute("aria-controls"));
          var r = panel.getBoundingClientRect();
          if (r.top > window.innerHeight * 0.8) panel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        }
      });
    });
  }

  /* ── Verification explorer ─────────────────────────── */
  function initVerify() {
    var root = document.getElementById("verify");
    var cases = window.C2C_VERIFY;
    if (!root || !cases) return;
    var tabsEl = root.querySelector(".case-picker");
    var img = root.querySelector(".frame img");
    var svg = root.querySelector(".frame svg");
    var note = root.querySelector(".v-note");
    var rail = root.querySelector(".rail");
    var verdict = root.querySelector(".v-verdict");
    var people = root.querySelector(".people");
    var action = root.querySelector(".v-action");
    var added = root.querySelector(".v-added");
    var promptP = root.querySelector(".v-prompt p");
    var wc = root.querySelector(".v-prompt .wc");
    var nov = root.querySelector(".v-noverify");
    var cur = null;

    function esc(t) { return t.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

    function showIter(c, k) {
      var it = c.iterations[k];
      img.src = c.img + it.iter + ".webp";
      img.alt = "Iteration " + it.iter + " layout: " + it.count + ".";
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      it.faces.forEach(function (f) {
        var r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        var pad = 6;
        r.setAttribute("x", f[0] - pad); r.setAttribute("y", f[1] - pad);
        r.setAttribute("width", f[2] - f[0] + 2 * pad); r.setAttribute("height", f[3] - f[1] + 2 * pad);
        r.setAttribute("rx", 6);
        r.setAttribute("class", "box " + (it.countFail ? "bad" : "ok"));
        svg.appendChild(r);
      });
      rail.querySelectorAll("button").forEach(function (b, i) {
        b.setAttribute("aria-selected", i === k ? "true" : "false");
        b.tabIndex = i === k ? 0 : -1;
      });
      verdict.className = "v-verdict " + it.status;
      verdict.innerHTML = (it.status === "pass" ? "✓ " : "✗ ") + esc(it.verdict) + " <small>" + esc(it.count) + "</small>";
      people.innerHTML = "";
      for (var p = 1; p <= c.people; p++) {
        var li = document.createElement("li");
        var name = "Person " + p;
        if (it.countFail) { li.textContent = "P" + p; }
        else if (it.matched.indexOf(name) >= 0) { li.className = "ok"; li.textContent = "P" + p + " ✓"; }
        else { li.className = "miss"; li.textContent = "P" + p + " missing"; }
        people.appendChild(li);
      }
      action.innerHTML = (it.check ? "<b>Verification</b>" + esc(it.check) + "<b class=\"next\">" : "<b>") +
        (it.status === "pass" ? "Next" : "What happens next") + "</b>" + esc(it.action);
      var adds = it.segs.filter(function (s) { return s[1]; }).map(function (s) { return s[0]; });
      if (adds.length) {
        var txt = adds.join(" … ");
        var words = txt.split(/\s+/).length;
        if (txt.length > 260) txt = txt.slice(0, 260).replace(/\s+\S*$/, "") + " … (+" + words + " words)";
        added.innerHTML = "<p><b>Added by Prompt Refinement before this iteration</b>“" + esc(txt) + "”</p>";
      } else added.innerHTML = "";
      promptP.innerHTML = it.segs.map(function (s) { return s[1] ? "<mark>" + esc(s[0]) + "</mark>" : esc(s[0]); }).join(" ");
      wc.textContent = "(" + it.words + " words)";
      if (c.noVerify && k === 0) {
        nov.hidden = false;
        nov.querySelector("p").textContent = c.noVerify.text;
      } else nov.hidden = true;
    }

    function showCase(idx) {
      var c = cases[idx];
      cur = c;
      caseBtns.forEach(function (b, i) {
        b.setAttribute("aria-selected", i === idx ? "true" : "false");
      });
      note.textContent = c.note;
      var max = Math.max.apply(null, cases.map(function (cc) { return Math.max.apply(null, cc.iterations.map(function (i) { return i.words; })); }));
      rail.innerHTML = "";
      c.iterations.forEach(function (it, k) {
        var li = document.createElement("li");
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("role", "tab");
        b.setAttribute("aria-label", "Iteration " + it.iter + ", " + (it.status === "pass" ? "passed" : "failed") + ", prompt " + it.words + " words");
        b.innerHTML = '<span class="wcount">' + it.words + 'w</span><span class="bar" style="height:' + Math.max(6, Math.round(64 * it.words / max)) + 'px"></span>' +
          "<span>" + it.iter + '</span><span class="st ' + it.status + '" aria-hidden="true">' + (it.status === "pass" ? "✓" : "✗") + "</span>";
        b.addEventListener("click", function () { showIter(c, k); });
        b.addEventListener("keydown", function (e) {
          var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
          if (!d) return;
          e.preventDefault();
          var n = (k + d + c.iterations.length) % c.iterations.length;
          rail.querySelectorAll("button")[n].focus();
          showIter(c, n);
        });
        li.appendChild(b);
        rail.appendChild(li);
      });
      rail.setAttribute("role", "tablist");
      rail.setAttribute("aria-label", "Iterations");
      showIter(c, 0);
      c.iterations.forEach(function (it) { var im = new Image(); im.src = c.img + it.iter + ".webp"; });
    }

    var groups = { paper: "Paper run, refinement on", textbg: "Background as text", early: "Early runs, refinement off" };
    var caseBtns = [];
    Object.keys(groups).forEach(function (g) {
      var idx = [];
      cases.forEach(function (c, i) { if (c.group === g) idx.push(i); });
      if (!idx.length) return;
      var wrap = document.createElement("div");
      wrap.className = "case-group";
      var lab = document.createElement("p");
      lab.className = "label";
      lab.id = "cg-" + g;
      lab.textContent = groups[g];
      var list = document.createElement("div");
      list.className = "case-list";
      list.setAttribute("role", "tablist");
      list.setAttribute("aria-labelledby", lab.id);
      idx.forEach(function (i) {
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("role", "tab");
        b.textContent = cases[i].label;
        b.addEventListener("click", function () { showCase(i); });
        caseBtns[i] = b;
        list.appendChild(b);
      });
      if (cases.length > 1) wrap.appendChild(lab);
      wrap.appendChild(list);
      tabsEl.appendChild(wrap);
    });
    // Preload iteration images so stepping is instant.
    showCase(0);
  }

  /* ── Copy BibTeX ───────────────────────────────────── */
  function initCopy() {
    var btn = document.querySelector(".copy");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var text = document.getElementById("bibtex").innerText;
      var done = function () {
        btn.textContent = "Copied";
        setTimeout(function () { btn.textContent = "Copy BibTeX"; }, 2000);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () { btn.textContent = "Select the text to copy"; });
      else btn.textContent = "Select the text to copy";
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initPlate();
    initChart();
    initTabs();
    initReveal();
    initVerify();
    initCopy();
  });
})();
