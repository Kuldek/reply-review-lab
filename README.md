# Reply Review Lab

A browser-based exercise in evaluating AI support replies. Five fictional customer requests each come with a short policy and two prewritten answers. Choose the reply you would send, record what tipped the balance, and export your decisions for discussion.

## Try a review

1. Download the repository, unzip it, and open `index.html` in a browser. The app works offline without installation.
2. Start with **The wrong size**. A customer wants a refund for an apron that doesn’t fit. Both replies offer a prepaid label, but only one follows the exchange policy.
3. Choose a reply and a deciding factor. Add a note if you want to capture the exact sentence that influenced you.
4. Use **Export JSON** to download your completed reviews. Each entry includes the policy, both candidates, and your decision, so another reviewer can follow your reasoning.

## Design choices

The candidates are fixed so two reviewers can discuss the same answer. Each decision records a preference and a reason separately. That distinction matters when a friendly answer makes a promise the policy cannot support.

Reviews save in browser storage when available. The app makes no network requests and uses no customer records, model credentials, or analytics.

## Run the tests

With Node.js 20 or later, run `node --test app.test.cjs`. The tests cover the case fixtures, review completion, storage recovery, and the exported report.
