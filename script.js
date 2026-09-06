/* activecompute.co — behaviour
   One text card on a canvas. Everything here is optional: the letter reads without JS.
   Feedback lands on the control the user touched, never in a toast; motion is transform
   and opacity only and honours prefers-reduced-motion. */

// ── CONFIG ─────────────────────────────────────────────────────────────────────────
const CONFIG = {
	/** The line a fresh sticky note shows until someone types over it. */
	stickyPlaceholder: "You found the canvas.\nMost people never double-click.",
	/** File name for Download → Markdown. */
	markdownFileName: "a-note-from-active-compute-co.md",
};

// ── Palette: the one content palette (Neutral + 7 hues). Card fill uses the tint. ──
const FILLS = {
	neutral: { solid: "#8c94a0", tint: "#f3f4f6" },
	lavender: { solid: "#a58ee0", tint: "#efeafa" },
	mint: { solid: "#7fc39a", tint: "#e7f4ec" },
	sky: { solid: "#7db4e0", tint: "#e8f2fa" },
	sand: { solid: "#d9b878", tint: "#faf3e4" },
	pink: { solid: "#dd94bb", tint: "#fbecf4" },
	teal: { solid: "#82c7c7", tint: "#e7f5f5" },
	coral: { solid: "#e39a86", tint: "#fceeea" },
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const card = $("#card");
const stage = $("#stage");
const letter = $("#letter");
const bar = $("#card-bar");
const grip = $(".grip", card);
const html = document.documentElement;
const BASE_TITLE = document.title;

// ── Theme: system → light → dark → system; a choice is remembered ─────────────────
(function theme() {
	const btn = $("#theme-toggle");
	const order = ["system", "light", "dark"];
	const label = { system: "system", light: "light", dark: "dark" };
	function current() {
		return html.getAttribute("data-theme") || "system";
	}
	function apply(mode) {
		if (mode === "system") html.removeAttribute("data-theme");
		else html.setAttribute("data-theme", mode);
		try {
			if (mode === "system") localStorage.removeItem("ac-theme");
			else localStorage.setItem("ac-theme", mode);
		} catch (_) {}
		btn.title = `Theme: ${label[mode]}`;
		btn.setAttribute("aria-label", `Theme: ${label[mode]}. Click to change.`);
	}
	apply(current());
	btn.addEventListener("click", () => apply(order[(order.indexOf(current()) + 1) % order.length]));
})();

// ── Arrival ────────────────────────────────────────────────────────────────────────
card.addEventListener("animationend", (e) => {
	if (e.animationName === "arrive") card.classList.remove("is-arriving");
});

// ── Selection + the bar ────────────────────────────────────────────────────────────
let selected = false;
const GAP = 10; // bar floats this far above the card

function positionBar() {
	if (!selected || card.hidden) return;
	const r = card.getBoundingClientRect();
	const vw = window.innerWidth;
	const vh = window.innerHeight;
	// Card scrolled fully out of view → the bar has nothing to attach to.
	if (r.bottom < 24 || r.top > vh - 24) {
		bar.classList.remove("is-open");
		return;
	}
	bar.classList.add("is-open");
	const bw = bar.offsetWidth;
	const bh = bar.offsetHeight;
	let top = r.top - GAP - bh;
	if (top < 8) top = 8; // clamp: floats over the card's top edge when there is no room above
	let left = r.left + r.width / 2 - bw / 2;
	left = Math.max(8, Math.min(vw - bw - 8, left));
	bar.style.transform = ""; // the open transition owns transform; position via left/top
	bar.style.left = `${Math.round(left)}px`;
	bar.style.top = `${Math.round(top)}px`;
}

function select() {
	if (selected || card.hidden) return;
	selected = true;
	card.classList.add("is-selected");
	bar.hidden = false;
	// Two frames: unhide, measure, then open — so the first position is right before it fades in.
	requestAnimationFrame(() => {
		positionBar();
		requestAnimationFrame(positionBar);
	});
}

function deselect() {
	if (!selected) return;
	selected = false;
	card.classList.remove("is-selected");
	closePopovers();
	bar.classList.remove("is-open");
	bar.addEventListener(
		"transitionend",
		() => {
			if (!selected) bar.hidden = true;
		},
		{ once: true },
	);
	if (reducedMotion()) bar.hidden = true;
}

// Click selects, unless the click ended a text selection inside the letter.
let pointerDownAt = null;
card.addEventListener("pointerdown", (e) => {
	pointerDownAt = { x: e.clientX, y: e.clientY };
});
card.addEventListener("click", (e) => {
	if (e.target.closest("a")) return;
	const sel = window.getSelection();
	const dragged =
		pointerDownAt && Math.hypot(e.clientX - pointerDownAt.x, e.clientY - pointerDownAt.y) > 4;
	if (dragged || (sel && !sel.isCollapsed && card.contains(sel.anchorNode))) return;
	select();
});
card.addEventListener("focus", () => select());

document.addEventListener("pointerdown", (e) => {
	if (card.contains(e.target) || bar.contains(e.target)) return;
	if (e.target.closest(".sticky")) return;
	deselect();
});

document.addEventListener("keydown", (e) => {
	if (e.key === "Escape") {
		if (openPopover) closePopovers();
		else if (selected) {
			deselect();
			card.blur();
		}
	}
	// ⌘Z / Ctrl+Z restores a closed card — the tooltip promised undo would.
	if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "z" && card.hidden) {
		e.preventDefault();
		restoreCard();
	}
});

let raf = 0;
function schedulePosition() {
	if (raf) return;
	raf = requestAnimationFrame(() => {
		raf = 0;
		positionBar();
	});
}
window.addEventListener("scroll", schedulePosition, { passive: true });
window.addEventListener("resize", schedulePosition);

// ── Popovers: one open at a time, closed by outside click or Escape ───────────────
let openPopover = null;
function closePopovers() {
	if (!openPopover) return;
	const { pop, btn } = openPopover;
	pop.hidden = true;
	btn.classList.remove("is-active");
	btn.setAttribute("aria-expanded", "false");
	openPopover = null;
}
function openPop(pop, btn) {
	closePopovers();
	pop.hidden = false;
	btn.classList.add("is-active");
	btn.setAttribute("aria-expanded", "true");
	openPopover = { pop, btn };
	const first = $("[role^=menuitem]", pop);
	if (first && !window.matchMedia("(pointer: coarse)").matches) first.focus({ preventScroll: true });
}
$$("[data-popover]", bar).forEach((btn) => {
	const pop = $(`#pop-${btn.dataset.popover}`);
	btn.addEventListener("click", () => {
		if (openPopover && openPopover.pop === pop) return closePopovers();
		openPop(pop, btn);
	});
});
document.addEventListener("pointerdown", (e) => {
	if (openPopover && !openPopover.pop.contains(e.target) && !openPopover.btn.contains(e.target)) {
		closePopovers();
	}
});

// ── Fill: paints the card, not the text ───────────────────────────────────────────
$$("[data-fill]", bar).forEach((sw) => {
	sw.addEventListener("click", () => {
		const key = sw.dataset.fill;
		$$("[data-fill]", bar).forEach((s) => {
			s.classList.toggle("is-current", s === sw);
			s.setAttribute("aria-checked", s === sw ? "true" : "false");
		});
		if (key === "none") {
			card.style.removeProperty("--card-fill");
			card.style.removeProperty("--card-fg");
			card.style.removeProperty("--ac-tagline-color");
		} else {
			// Tints are light in both themes, so text goes to ink on a filled card.
			card.style.setProperty("--card-fill", FILLS[key].tint);
			card.style.setProperty("--card-fg", "#1e2024");
			card.style.setProperty("--ac-tagline-color", "#707070");
		}
		closePopovers();
	});
});

// ── Align ─────────────────────────────────────────────────────────────────────────
$$("[data-align]", bar).forEach((row) => {
	row.addEventListener("click", () => {
		const value = row.dataset.align;
		letter.style.setProperty("--align", value);
		$("#align-icon").setAttribute("href", `#i-align-${value}`);
		$("[data-popover=align]", bar).title = `Align — ${value}`;
		$$("[data-align]", bar).forEach((r) => {
			const on = r === row;
			r.setAttribute("aria-checked", on ? "true" : "false");
			$(".check", r).hidden = !on;
		});
		closePopovers();
	});
});

// ── The letter as text and as Markdown — derived from the DOM, so there is one source ──
function inline(node) {
	let out = "";
	node.childNodes.forEach((n) => {
		if (n.nodeType === Node.TEXT_NODE) out += n.textContent;
		else if (n.nodeName === "STRONG" || n.nodeName === "B") out += `**${inline(n)}**`;
		else if (n.nodeName === "EM" || n.nodeName === "I") out += `*${inline(n)}*`;
		else if (n.nodeName === "A") out += `[${inline(n)}](${n.getAttribute("href")})`;
		else if (n.nodeName === "BR") out += "  \n";
		else out += inline(n);
	});
	return out;
}
function letterMarkdown() {
	const parts = [];
	letter.querySelectorAll(":scope > *").forEach((el) => {
		const tag = el.nodeName;
		if (tag === "H1") parts.push(`# ${inline(el).trim()}`);
		else if (tag === "H2") parts.push(`## ${inline(el).trim()}`);
		else if (tag === "P") parts.push(inline(el).replace(/\s+/g, " ").trim());
		else if (tag === "UL")
			parts.push(
				$$("li", el)
					.map((li) => `- ${inline(li).replace(/\s+/g, " ").trim()}`)
					.join("\n"),
			);
	});
	parts.push("**Active Compute Co.**");
	parts.push("*Make your compute work for you.*");
	return `${parts.join("\n\n")}\n`;
}
function letterText() {
	const parts = [];
	letter.querySelectorAll(":scope > *").forEach((el) => {
		if (el.nodeName === "UL") parts.push($$("li", el).map((li) => `• ${li.innerText.trim()}`).join("\n"));
		else parts.push(el.innerText.replace(/\s+/g, " ").trim());
	});
	parts.push("Active Compute Co.\nMake your compute work for you.");
	return `${parts.join("\n\n")}\n`;
}

// ── Download / Copy ───────────────────────────────────────────────────────────────
function downloadMarkdown() {
	const blob = new Blob([letterMarkdown()], { type: "text/markdown;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const a = Object.assign(document.createElement("a"), { href: url, download: CONFIG.markdownFileName });
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function flashSuccess(btn, useEl, restoreHref) {
	btn.classList.add("is-success");
	useEl.setAttribute("href", "#i-check");
	setTimeout(() => {
		btn.classList.remove("is-success");
		useEl.setAttribute("href", restoreHref);
	}, 1200);
}
async function copy(text) {
	try {
		await navigator.clipboard.writeText(text);
	} catch (_) {
		const ta = Object.assign(document.createElement("textarea"), { value: text });
		ta.style.position = "fixed";
		ta.style.opacity = "0";
		document.body.appendChild(ta);
		ta.select();
		document.execCommand("copy");
		ta.remove();
	}
	flashSuccess($("#copy-btn"), $("#copy-icon"), "#i-copy");
}
$$("[data-action]", bar).forEach((row) => {
	row.addEventListener("click", () => {
		const action = row.dataset.action;
		closePopovers();
		if (action === "download-md") downloadMarkdown();
		else if (action === "download-pdf") {
			deselect();
			setTimeout(() => window.print(), 150);
		} else if (action === "copy-text") copy(letterText());
		else if (action === "copy-md") copy(letterMarkdown());
		else if (action === "rename") startRename();
		else if (action === "reset") resetCanvas();
		// Source — the card's provenance flyout, hung off the More slot like the app's.
		else if (action === "source") openPop($("#pop-source"), $("[data-popover=more]", bar));
	});
});

// ── The signature signs: click the sign-off and the people behind the mark appear ─
(function signature() {
	const signoff = $(".signoff");
	const sig = $(".ac-signature", signoff);
	if (!sig) return;
	const toggle = () => {
		const on = signoff.classList.toggle("is-signed");
		sig.setAttribute("aria-expanded", on ? "true" : "false");
	};
	sig.addEventListener("click", toggle);
	sig.addEventListener("keydown", (e) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			toggle();
		}
	});
})();

// ── Name chip: rename the card (and the tab) ──────────────────────────────────────
const nameChip = $("#name-chip");
const nameLabel = $("#name-label");
const INTRINSIC = nameLabel.textContent.trim(); // the letter's own first words
let cardName = "";
function startRename() {
	if ($(".name-field", bar)) return;
	const input = Object.assign(document.createElement("input"), {
		className: "name-field",
		value: cardName,
		placeholder: INTRINSIC,
		title: "Card name — Enter saves, Esc cancels",
		id: "card-bar-text-name",
	});
	input.setAttribute("aria-label", "Card name");
	nameChip.replaceWith(input);
	input.focus();
	input.select();
	let done = false;
	const finish = (commit) => {
		if (done) return;
		done = true;
		if (commit) {
			cardName = input.value.trim();
			nameLabel.textContent = cardName || INTRINSIC;
			document.title = cardName ? `${cardName} — Active Compute Co.` : BASE_TITLE;
		}
		input.replaceWith(nameChip);
		nameChip.focus({ preventScroll: true });
		schedulePosition();
	};
	input.addEventListener("keydown", (e) => {
		if (e.key === "Enter" || e.keyCode === 13) finish(true);
		else if (e.key === "Escape") {
			e.stopPropagation();
			finish(false);
		}
	});
	input.addEventListener("blur", () => finish(true));
	schedulePosition();
}
nameChip.addEventListener("click", startRename);

// ── Close: the card leaves the canvas. Reload — or ⌘Z — brings it back. ──────────
$("#close-btn").addEventListener("click", () => {
	deselect();
	const hide = () => {
		card.hidden = true;
		card.classList.remove("is-departing");
	};
	if (reducedMotion()) return hide();
	card.classList.add("is-departing");
	// `animationend` is the normal path; the timer covers a background tab or anything
	// else that stops the animation from ever firing — the card must still go.
	let done = false;
	const once = () => {
		if (done) return;
		done = true;
		hide();
	};
	card.addEventListener("animationend", once, { once: true });
	setTimeout(once, 320);
});
function restoreCard() {
	card.hidden = false;
	card.classList.add("is-arriving");
	card.focus({ preventScroll: true });
}

// ── Hold the top and drag (fine pointers only; the grip is display:none on touch) ─
(function drag() {
	if (!grip) return;
	let start = null;
	let dx = 0;
	let dy = 0;
	grip.addEventListener("pointerdown", (e) => {
		if (e.button !== 0) return;
		e.preventDefault();
		try {
			grip.setPointerCapture(e.pointerId);
		} catch (_) {
			/* no active pointer (synthetic event) — the drag still works without capture */
		}
		start = { x: e.clientX - dx, y: e.clientY - dy };
		card.classList.add("is-dragging");
		document.body.classList.add("is-dragging");
		select();
	});
	grip.addEventListener("pointermove", (e) => {
		if (!start) return;
		dx = e.clientX - start.x;
		dy = e.clientY - start.y;
		card.style.setProperty("--dx", `${dx}px`);
		card.style.setProperty("--dy", `${dy}px`);
		positionBar();
	});
	const end = () => {
		if (!start) return;
		start = null;
		card.classList.remove("is-dragging");
		document.body.classList.remove("is-dragging");
	};
	grip.addEventListener("pointerup", end);
	grip.addEventListener("pointercancel", end);
	window.__resetCardPosition = () => {
		dx = 0;
		dy = 0;
		card.style.removeProperty("--dx");
		card.style.removeProperty("--dy");
	};
})();

// ── Pan the ground: drag the empty canvas and the dots slide under everything ─────
(function pan() {
	let start = null;
	let px = 0;
	let py = 0;
	let moved = false;
	const isGround = (t) =>
		t === document.body || t === document.documentElement || t.classList?.contains("page") || t === stage;
	document.addEventListener("pointerdown", (e) => {
		if (e.button !== 0 || !isGround(e.target)) return;
		start = { x: e.clientX - px, y: e.clientY - py };
		moved = false;
	});
	document.addEventListener("pointermove", (e) => {
		if (!start) return;
		const nx = e.clientX - start.x;
		const ny = e.clientY - start.y;
		if (!moved && Math.hypot(nx - px, ny - py) < 3) return;
		moved = true;
		document.body.classList.add("is-panning");
		px = nx;
		py = ny;
		document.body.style.setProperty("--pan-x", `${px}px`);
		document.body.style.setProperty("--pan-y", `${py}px`);
	});
	const end = () => {
		start = null;
		document.body.classList.remove("is-panning");
	};
	document.addEventListener("pointerup", end);
	document.addEventListener("pointercancel", end);
	window.__resetPan = () => {
		px = 0;
		py = 0;
		document.body.style.removeProperty("--pan-x");
		document.body.style.removeProperty("--pan-y");
	};
})();

function resetCanvas() {
	window.__resetCardPosition?.();
	window.__resetPan?.();
	$$(".sticky").forEach((s) => s.remove());
	schedulePosition();
}

// ── Sticky note: double-click the empty canvas ────────────────────────────────────
document.addEventListener("dblclick", (e) => {
	const t = e.target;
	if (t.closest?.(".card, .card-bar, .footer, .masthead, .sticky, a, button")) return;
	const note = document.createElement("div");
	note.className = "sticky";
	note.contentEditable = "true";
	note.spellcheck = false;
	note.setAttribute("role", "note");
	note.setAttribute("aria-label", "Sticky note");
	note.dataset.placeholder = CONFIG.stickyPlaceholder;
	note.style.setProperty("--tilt", `${(Math.random() * 5 - 2.5).toFixed(1)}deg`);
	note.style.left = `${Math.round(e.pageX - 100)}px`;
	note.style.top = `${Math.round(e.pageY - 24)}px`;
	note.addEventListener("keydown", (ev) => {
		ev.stopPropagation();
		if (ev.key === "Escape") note.blur();
		if ((ev.key === "Backspace" || ev.key === "Delete") && note.textContent.length === 0) {
			ev.preventDefault();
			note.remove();
		}
	});
	document.body.appendChild(note);
	note.focus();
	window.getSelection()?.collapseToEnd?.();
});
