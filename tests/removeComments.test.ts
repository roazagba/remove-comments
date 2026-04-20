import { removeCommentsSelective } from '../src/removeCommentsSelective';

describe('removeCommentsSelective', () => {
    
test('removes line comments from JavaScript', () => {
        const input = `// This is a line comment\n        const x = 1; // This should be removed`;
        const expected = `        const x = 1; `;
        expect(removeCommentsSelective(input, 'JavaScript')).toBe(expected);
    });

    test('removes block comments from JavaScript', () => {
        const input = `/* This is a block comment */\n        const y = 2; /* This should be removed */`;
        const expected = `        const y = 2; `;
        expect(removeCommentsSelective(input, 'JavaScript')).toBe(expected);
    });

    test('removes single line comments from Python', () => {
        const input = `# This is a line comment\nx = 1  # This should be removed`;
        const expected = `x = 1  `;
        expect(removeCommentsSelective(input, 'Python')).toBe(expected);
    });

    test('removes block comments from HTML', () => {
        const input = `<!-- This is a comment -->\n<div>Hello World</div>`;
        const expected = `<div>Hello World</div>`;
        expect(removeCommentsSelective(input, 'HTML')).toBe(expected);
    });
    
    // Add more tests as needed for additional languages
});
