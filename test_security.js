import { escapeHTML, html } from './src/utils/dom.js';

function testEscape() {
    console.log('--- Testing escapeHTML ---');
    const cases = [
        { input: '<script>alert(1)</script>', expected: '&lt;script&gt;alert(1)&lt;/script&gt;' },
        { input: 'John "CEO" Doe', expected: 'John &quot;CEO&quot; Doe' },
        { input: 'O\'Brian', expected: 'O&#39;Brian' },
        { input: 'A & B', expected: 'A &amp; B' }
    ];

    cases.forEach(({ input, expected }, i) => {
        const result = escapeHTML(input);
        console.log(`Test ${i + 1}: ${result === expected ? '✅ PASS' : '❌ FAIL'}`);
        if (result !== expected) {
            console.log(`   Expected: ${expected}`);
            console.log(`   Actual:   ${result}`);
        }
    });
}

function testHtmlTag() {
    console.log('\n--- Testing html template tag ---');
    const unsafeName = '<img src=x onerror=alert(1)>';
    const output = html`<div>Hello, ${unsafeName}!</div>`;
    const expected = '<div>Hello, &lt;img src=x onerror=alert(1)&gt;!</div>';

    console.log(`Tag Test: ${output === expected ? '✅ PASS' : '❌ FAIL'}`);
    if (output !== expected) {
        console.log(`   Expected: ${expected}`);
        console.log(`   Actual:   ${output}`);
    }
}

testEscape();
testHtmlTag();
