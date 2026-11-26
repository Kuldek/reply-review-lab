'use strict';

const cases = [
  {
    id: 'wrong-size', title: 'The wrong size', category: 'Returns',
    message: 'The apron arrived yesterday. I tried it on and it’s too short. Could I get my money back?',
    policy: 'Unwashed aprons can be exchanged for a different size within 14 days. Refunds are available only for faulty items. A prepaid label is provided for size exchanges.',
    A: 'I can arrange a refund once the apron comes back. Confirm it hasn’t been washed and I’ll send a prepaid label.',
    B: 'I’m sorry the fit was off. If the apron is unwashed, I can send a prepaid label and arrange another size. A size issue qualifies for an exchange. Would you like the size chart?',
  },
  {
    id: 'missed-slot', title: 'A missed pickup', category: 'Order collection',
    message: 'My bus broke down and I missed my pickup slot today. Is my lamp still there?',
    policy: 'Pickup orders are held until the end of the next open day. A customer can collect during any open hour in that window using the original collection code.',
    A: 'That sounds frustrating. Your lamp is held through the end of our next open day. Bring your original collection code any time we’re open before then.',
    B: 'I’m sorry about the bus. I can request a new slot for you, but the original code has expired. Please wait for a replacement code before coming in.',
  },
  {
    id: 'shared-pass', title: 'A spare seat', category: 'Workshop bookings',
    message: 'My friend can take my place at the bookbinding class tomorrow. Can I just forward the pass?',
    policy: 'Seats can be transferred until two hours before class. The booking holder must request a name change and receive an updated pass before sharing it.',
    A: 'Yes, you can forward your pass. If your friend arrives early, the instructor can change the name at the door.',
    B: 'There’s time to transfer the seat. Request a name change at least two hours before class, then forward the updated pass when it arrives.',
  },
  {
    id: 'quiet-parcel', title: 'A quiet tracking page', category: 'Shipping',
    message: 'The tracking page hasn’t moved for two business days. This was meant to be a gift. What can I do?',
    policy: 'A trace may be opened after three complete business days without a scan. Support can check the delivery address sooner. A trace does not guarantee a delivery date.',
    A: 'I understand the timing matters for a gift. We can check the delivery address now. If tracking still hasn’t moved after the third full business day, we can open a trace.',
    B: 'I understand the timing matters. I’ll open a trace now and ask the carrier to guarantee delivery by tomorrow.',
  },
  {
    id: 'paused-box', title: 'Skipping a box', category: 'Subscriptions',
    message: 'I’m away next month. Can I skip my tea box without losing the discount on my plan?',
    policy: 'Subscribers may skip one upcoming box before its renewal date and keep their existing discount. A skip does not affect later boxes. Cancellation ends the discount.',
    A: 'Cancel the subscription before it renews. When you return, sign up again and we’ll restore your original discount.',
    B: 'Choose “Skip next box” before renewal. You’ll keep your discount, and the following box will arrive on the usual schedule.',
  },
];

const reasons = ['Policy accuracy', 'Clarity', 'Empathy', 'Practical next step'];
const storageKey = 'reply-review-lab.v1';

function cleanReview(input = {}) {
  return {
    winner: ['A', 'B'].includes(input?.winner) ? input.winner : '',
    reason: reasons.includes(input?.reason) ? input.reason : '',
    note: typeof input?.note === 'string' ? input.note.slice(0, 600) : '',
  };
}

function isComplete(review) {
  return Boolean(review?.winner && review?.reason);
}

function reviewedCases(reviews) {
  return cases.filter(item => isComplete(reviews[item.id]));
}

function readSavedReviews(serialized) {
  let previous;
  try {
    previous = JSON.parse(serialized);
  } catch {
    previous = {};
  }
  return Object.fromEntries(cases.map(item => [item.id, cleanReview(previous?.[item.id])]));
}

function report(reviews) {
  return {
    formatVersion: 1,
    project: 'Reply Review Lab',
    casesTotal: cases.length,
    reviews: reviewedCases(reviews).map(item => ({
      caseId: item.id, title: item.title, customerMessage: item.message,
      policy: item.policy, replies: { A: item.A, B: item.B },
      decision: { ...reviews[item.id] },
    })),
  };
}

function startLab() {
  const byId = id => document.getElementById(id);
  const winningInputs = [...document.querySelectorAll('input[name="winner"]')];
  let reviews = {};
  let index = 0;
  let persistent = true;
  try {
    reviews = readSavedReviews(localStorage.getItem(storageKey));
  } catch {
    // Storage may be unavailable for local files or private browsing.
    reviews = {};
  }

  function refreshProgress() {
    const count = reviewedCases(reviews).length;
    byId('progress').value = count;
    byId('progress-label').textContent = `${count} of ${cases.length} reviewed`;
    byId('export').disabled = count === 0;
    cases.forEach((item, i) => {
      const button = byId('queue').children[i];
      const done = isComplete(reviews[item.id]);
      if (i === index) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
      button.setAttribute('aria-label', item.title + (done ? ', reviewed' : ', pending'));
      const marker = button.firstElementChild;
      marker.classList.toggle('done', done);
      marker.textContent = done ? '✓' : '';
    });
    const current = reviews[cases[index].id];
    let status;
    if (isComplete(current)) status = persistent ? 'Review saved in this browser.' : 'Review ready to export. Browser storage is unavailable.';
    else if (current?.winner) status = 'Choose a deciding factor to finish this review.';
    else status = 'Choose a reply and a deciding factor to record a review.';
    if (byId('status').textContent !== status) byId('status').textContent = status;
  }

  function openCase(position, focus) {
    index = position;
    const item = cases[index];
    const review = reviews[item.id] || cleanReview();
    byId('category').textContent = item.category;
    byId('case-title').textContent = item.title;
    byId('message').textContent = '“' + item.message + '”';
    byId('policy').textContent = item.policy;
    byId('reply-a').textContent = item.A;
    byId('reply-b').textContent = item.B;
    for (const radio of winningInputs) radio.checked = radio.value === review.winner;
    byId('reason').value = review.reason;
    byId('note').value = review.note;
    byId('next').textContent = index === cases.length - 1 ? 'First case' : 'Next case';
    refreshProgress();
    if (focus) byId('case-title').focus();
  }

  function saveReview() {
    const id = cases[index].id;
    reviews[id] = cleanReview({
      winner: winningInputs.find(input => input.checked)?.value,
      reason: byId('reason').value, note: byId('note').value,
    });
    try {
      const merged = readSavedReviews(localStorage.getItem(storageKey));
      merged[id] = reviews[id];
      localStorage.setItem(storageKey, JSON.stringify(merged));
      reviews = merged;
      persistent = true;
    } catch {
      persistent = false;
    }
    refreshProgress();
  }

  for (const [i, item] of cases.entries()) {
    const button = document.createElement('button');
    button.type = 'button';
    const marker = document.createElement('span');
    marker.className = 'marker';
    marker.setAttribute('aria-hidden', 'true');
    button.append(marker, item.title);
    button.addEventListener('click', () => openCase(i, true));
    byId('queue').append(button);
  }
  byId('review').addEventListener('submit', event => event.preventDefault());
  byId('review').addEventListener('input', saveReview);
  byId('next').addEventListener('click', () => openCase((index + 1) % cases.length, true));
  byId('export').addEventListener('click', () => {
    const file = new Blob([JSON.stringify(report(reviews), null, 2) + '\n'], { type: 'application/json' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'reply-reviews.json';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  byId('lab').hidden = false;
  openCase(index, false);
}

if (typeof document !== 'undefined') startLab();
if (typeof module !== 'undefined') module.exports = { cases, cleanReview, isComplete, readSavedReviews, report };
