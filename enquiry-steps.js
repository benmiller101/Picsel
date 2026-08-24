/* ---- enquiry-steps.js — one question at a time ----------------------------
   The enquiry form ships as six fields in one column. That is a wall, and a
   wall is where somebody reading the site on a phone between jobs decides it
   can wait until this evening. This file turns the same markup into three
   steps: what you need, then the job, then how to reach you.

   Enhancement only, in exactly the sense contact.js is. The markup is already
   a complete working form and every control this file needs is already in it,
   shipped with the `hidden` attribute set. Nothing here writes a field, a
   label or a sentence. If this file never loads, is blocked, or throws on line
   one, all three fieldsets are on screen at once and the form posts the
   ordinary way. That is why the Back and Continue buttons are hidden in the
   markup rather than created here: a Continue button that leads nowhere is
   worse than no Continue button.

   WHY VALIDATION IS TAKEN OVER RATHER THAN LEFT TO THE BROWSER. A required
   field inside a hidden fieldset cannot be focused, and a browser that cannot
   focus the field it wants to complain about refuses to submit the form at all
   and logs an error nobody sees. So once stepping is on, `noValidate` goes on
   the form and this file walks the steps itself, finds the first field the
   browser considers invalid, shows the step it lives on and then asks the
   browser to report it. The message is still the browser's own: translated,
   announced, and attached to the field that is actually wrong. Only the timing
   is ours. With this file absent, `noValidate` is never set and the browser
   does all of it unaided. */

/**
 * @param {HTMLFormElement} form
 * @returns {{ firstInvalidStep: () => boolean } | null}
 *   null when the stepped markup is not present, which is the signal to the
 *   caller to leave validation to the browser.
 */
export function initEnquirySteps(form) {
  const steps = [...form.querySelectorAll('.enquiry-step')];
  const trail = form.querySelector('.enquiry-steps');

  /* All or nothing. A half-built wizard is worse than no wizard, so if the
     markup ever changes underneath this file it does nothing and leaves a form
     that still works. */
  if (steps.length < 2 || !trail) return null;

  const trailSteps = [...trail.querySelectorAll('[data-goto]')];
  const message = form.querySelector('#enquiry-message');
  const prompts = [...form.querySelectorAll('.enquiry-prompt')];

  /* How far anyone has got. The trail lets you go back to a step you have
     already seen and no further, which is the difference between a way to
     correct an answer and a way to skip the question. */
  let current = 0;
  let furthest = 0;

  form.noValidate = true;
  form.classList.add('is-stepped');
  trail.hidden = false;
  for (const control of form.querySelectorAll('[data-next], [data-back]')) control.hidden = false;

  show(0, { focus: false });

  /* ---- Moving between steps ---------------------------------------------- */

  function show(index, { focus = true } = {}) {
    current = Math.max(0, Math.min(index, steps.length - 1));
    furthest = Math.max(furthest, current);

    steps.forEach((step, i) => {
      step.hidden = i !== current;
    });

    trailSteps.forEach((step, i) => {
      /* Visited steps are the only ones you can jump to, and the one you are
         on is not worth jumping to. aria-current tells a screen reader which
         of the three it is without the number being read out as decoration.

         `i > furthest`, not `i >= furthest`, and the difference is a real bug
         rather than a fencepost quibble. Submitting with an unanswered step
         one throws you back to step one, and with `>=` the step you had
         already filled in would be locked from that moment on: the only way
         forward would be Continue, through everything in between. */
      step.disabled = i > furthest || i === current;
      if (i === current) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
      step.classList.toggle('is-current', i === current);
      step.classList.toggle('is-done', i < furthest && i !== current);
    });

    /* Focus lands on the new step's own heading rather than its first field.
       Someone tabbing through has just been moved to a part of the form they
       have not read yet, and dropping them straight into an input skips the
       question it is asking. */
    if (focus) {
      const legend = steps[current].querySelector('.enquiry-step__legend');
      if (legend) legend.focus();
    }
  }

  /* Validity for one step, reported the browser's way. Returns true when
     everything on the step passes. */
  function stepIsValid(index) {
    const fields = [...steps[index].querySelectorAll('input, select, textarea')];
    /* The honeypot lives outside the fieldsets, so nothing here can trip it. */
    const bad = fields.find((field) => !field.checkValidity());
    if (!bad) return true;

    /* The step has to be on screen before the browser can point at the field:
       reportValidity on something hidden is a no-op. */
    if (index !== current) show(index, { focus: false });
    bad.reportValidity();
    return false;
  }

  form.addEventListener('click', (event) => {
    const next = event.target.closest('[data-next]');
    if (next) {
      if (stepIsValid(current)) show(current + 1);
      return;
    }

    const back = event.target.closest('[data-back]');
    if (back) {
      show(current - 1);
      return;
    }

    const goto = event.target.closest('[data-goto]');
    if (goto) {
      show(Number(goto.dataset.goto) - 1);
      return;
    }

    /* See the comment on the change handler below for why this is on click and
       why it matches the input rather than the label around it. */
    const need = event.target.closest('input[name="need"]');
    if (need && need.checked && current === 0) show(1);
  });

  /* ---- Step one, answered with one tap ------------------------------------
     Two events, two jobs, and keeping them apart is the whole of this block.

     `change` fires on every option a keyboard user arrows past, because that
     is what arrowing through a radio group does: it moves the selection. So
     change updates the tailored prompt below, which is free and invisible, and
     never advances. Advancing on change would throw somebody to step two the
     instant they pressed the down arrow, before they had heard the other three
     options read out.

     `click` is the one that means "this one, then". Chrome fires it for a tap,
     for a mouse click and for Space on a focused radio, and does not fire it
     for an arrow key. Clicking the label forwards a click to the input inside
     it, so matching on the input rather than the label is what stops a single
     tap being counted twice and skipping step two entirely. */
  form.addEventListener('change', (event) => {
    if (event.target.name === 'need') showPrompt(event.target.value);
    else if (event.target === message) syncSkipLabel();
  });

  /* The tailored second step. Every variant is already in the markup, one per
     answer plus a fallback with an empty data-need; this only chooses which is
     visible. The words stay in tools/pages/contact.js next to the option they
     belong to. */
  function showPrompt(need) {
    for (const prompt of prompts) prompt.hidden = prompt.dataset.need !== need;
  }

  /* Continue or Skip, depending on whether there is anything to continue with.
     The message field is deliberately not required — a name, an email and "a
     new website" is already worth ringing back — and this is what makes that
     visible instead of leaving people guessing whether the box has to be
     filled. */
  function syncSkipLabel() {
    if (!message) return;
    const button = message.closest('.enquiry-step')?.querySelector('[data-next]');
    if (!button || !button.dataset.emptyLabel) return;

    if (!button.dataset.fullLabel) button.dataset.fullLabel = button.textContent.trim();
    button.textContent = message.value.trim() ? button.dataset.fullLabel : button.dataset.emptyLabel;
  }

  form.addEventListener('input', (event) => {
    if (event.target === message) syncSkipLabel();
  });

  syncSkipLabel();

  /* Enter inside a text field would otherwise submit the form from step one,
     which is a submission missing everything the later steps ask for. On any
     step but the last it means Continue. The textarea is left alone: Enter in
     a message box is a new line and always has been. */
  form.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    if (event.target.tagName === 'TEXTAREA') return;
    if (event.target.closest('[data-back], [data-goto]')) return;
    if (current === steps.length - 1) return;

    event.preventDefault();
    if (stepIsValid(current)) show(current + 1);
  });

  return {
    /**
     * Called by contact.js before it sends anything. Walks the steps in order,
     * and on the first one that fails, shows it and lets the browser complain.
     * Returns true only when the whole form is ready to go.
     */
    firstInvalidStep() {
      for (let i = 0; i < steps.length; i += 1) {
        if (!stepIsValid(i)) return false;
      }
      return true;
    },

    /**
     * Called once the enquiry has genuinely arrived. Takes the whole form off
     * screen and leaves the confirmation on its own.
     *
     * Without this, contact.js's form.reset() would empty the fields and leave
     * step three sitting under the thank-you message, which reads as an
     * invitation to send it again — and a second identical enquiry is a real
     * cost to whoever answers them.
     */
    complete() {
      for (const step of steps) step.hidden = true;
      trail.hidden = true;
    },
  };
}
