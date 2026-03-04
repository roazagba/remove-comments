import * as vscode from 'vscode';
import strip from 'strip-comments';

// Interface for language comment configurations
interface LanguageConfig {
    line?: string | string[];     // Line comment symbols
    block?: {                     // Block comment symbols
        start: string;
        end: string;
    }[];
}

// Comment configurations for most common languages
const commentConfigs: Record<string, LanguageConfig> = {
    javascript: {
        line: '//',
        block: [{ start: '/*', end: '*/' }]
    },
    typescript: {
        line: '//',
        block: [{ start: '/*', end: '*/' }]
    },
    javascriptreact: {
        line: '//',
        block: [{ start: '/*', end: '*/' }]
    },
    typescriptreact: {
        line: '//',
        block: [{ start: '/*', end: '*/' }]
    },
    java: {
        line: '//',
        block: [{ start: '/*', end: '*/' }]
    },
    c: {
        line: '//',
        block: [{ start: '/*', end: '*/' }]
    },
    cpp: {
        line: '//',
        block: [{ start: '/*', end: '*/' }]
    },
    csharp: {
        line: '//',
        block: [{ start: '/*', end: '*/' }]
    },
    php: {
        line: ['//', '#'],
        block: [{ start: '/*', end: '*/' }]
    },
    python: {
        line: '#',
        block: [
            { start: '"""', end: '"""' },
            { start: "'''", end: "'''" }
        ]
    },
    ruby: {
        line: '#',
        block: [{ start: '=begin', end: '=end' }]
    },
    go: {
        line: '//',
        block: [{ start: '/*', end: '*/' }]
    },
    rust: {
        line: '//',
        block: [{ start: '/*', end: '*/' }]
    },
    swift: {
        line: '//',
        block: [{ start: '/*', end: '*/' }]
    },
    kotlin: {
        line: '//',
        block: [{ start: '/*', end: '*/' }]
    },
    scala: {
        line: '//',
        block: [{ start: '/*', end: '*/' }]
    },
    dart: {
        line: '//',
        block: [{ start: '/*', end: '*/' }]
    },
    
    // Web languages
    html: {
        block: [{ start: '<!--', end: '-->' }]
    },
    xml: {
        block: [{ start: '<!--', end: '-->' }]
    },
    css: {
        block: [{ start: '/*', end: '*/' }]
    },
    scss: {
        line: '//',
        block: [{ start: '/*', end: '*/' }]
    },
    less: {
        line: '//',
        block: [{ start: '/*', end: '*/' }]
    },
    
    bash: {
        line: '#'
    },
    shellscript: {
        line: '#'
    },
    powershell: {
        line: '#'
    },
    perl: {
        line: '#'
    },
    
    sql: {
        line: '--',
        block: [{ start: '/*', end: '*/' }]
    },
    
    yaml: {
        line: '#'
    },
    toml: {
        line: '#'
    },
    ini: {
        line: ';'
    },
    
    default: {
        line: ['//', '#', ';', '--', '%', '"'],
        block: [
            { start: '/*', end: '*/' },
            { start: '<!--', end: '-->' },
            { start: '{-', end: '-}' }
        ]
    }
};

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "remove-comments" is now active');

    // C1: remove all comments
    const removeAllCommand = vscode.commands.registerCommand('extension.removeAllComments', () => {
        processComments('all');
    });

    // C2: remove only line comments
    const removeLineCommand = vscode.commands.registerCommand('extension.removeLineComments', () => {
        processComments('line');
    });

    // C3: remove only block comments
    const removeBlockCommand = vscode.commands.registerCommand('extension.removeBlockComments', () => {
        processComments('block');
    });

    context.subscriptions.push(removeAllCommand, removeLineCommand, removeBlockCommand);
}

function processComments(type: 'all' | 'line' | 'block') {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No file open');
        return;
    }

    const document = editor.document;
    const fullText = document.getText();
    const language = document.languageId;

    try {
        let modifiedText = fullText;
        
        if (type === 'all') {
            // use strip-comments for all comments
            modifiedText = strip(fullText, {
                language: language,
                preserveNewlines: true
            });
        } else {
            // selective removal using our custom implementation
            modifiedText = removeCommentsSelective(fullText, language, type);
        }

        // replace the content
        editor.edit(editBuilder => {
            const start = new vscode.Position(0, 0);
            const end = new vscode.Position(document.lineCount - 1, 
                document.lineAt(document.lineCount - 1).text.length);
            const range = new vscode.Range(start, end);
            editBuilder.replace(range, modifiedText);
        }).then(success => {
            if (success) {
                const messages = {
                    all: 'All comments have been removed',
                    line: 'Line comments removed',
                    block: 'Block comments removed'
                };
                vscode.window.showInformationMessage(messages[type]);
            } else {
                vscode.window.showErrorMessage('Failed to remove comments');
            }
        });
    } catch (err) {
        vscode.window.showErrorMessage(`Error: ${err}`);
    }
}

function removeCommentsSelective(text: string, language: string, type: 'line' | 'block'): string {
    const config = commentConfigs[language] || commentConfigs.default;
    let result = text;

    if (type === 'line' && config.line) {
        // remove line comments
        const lineSymbols = Array.isArray(config.line) ? config.line : [config.line];
        
        // Process line by line for greater control
        const lines = result.split('\n');
        const processedLines: string[] = [];
        
        for (let line of lines) {
            let inString = false;
            let stringChar = '';
            let inUrl = false;
            let commentIndex = -1;
            let commentSymbol = '';
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const nextTwoChars = line.substr(i, 2);
                const nextThreeChars = line.substr(i, 3);
                
                // Managing character strings
                if ((char === '"' || char === "'" || char === '`') && 
                    (i === 0 || line[i-1] !== '\\')) {
                    if (!inString) {
                        inString = true;
                        stringChar = char;
                    } else if (char === stringChar) {
                        inString = false;
                    }
                    continue;
                }
                
                // Detect URLs
                if (nextThreeChars === 'htt' || nextThreeChars === 'ftp') {
                    inUrl = true;
                    continue;
                }
                if (nextTwoChars === '://') {
                    inUrl = true;
                    continue;
                }
                
                // Reset inUrl at the end of the URL
                if (inUrl && (char === ' ' || char === '\t' || char === ')' || char === ']' || i === line.length - 1)) {
                    inUrl = false;
                }
                
                // Ignore comments in strings or URLs
                if (inString || inUrl) {
                    continue;
                }
                
                // Search for a comment symbol
                for (const symbol of lineSymbols) {
                    if (line.substr(i, symbol.length) === symbol) {
                        commentIndex = i;
                        commentSymbol = symbol;
                        break;
                    }
                }
                
                if (commentIndex !== -1) {
                    break;
                }
            }
            
            // Process the line if a comment was found
            if (commentIndex !== -1) {
                const beforeComment = line.substring(0, commentIndex);
                // Check if everything before is a comment or valid code
                if (beforeComment.trim() === '') {
                    // Line entirely commented out, remove it
                    processedLines.push('');
                } else {
                    // Keep the part before the comment
                    processedLines.push(beforeComment.replace(/\s+$/, ''));
                }
            } else {
                // No comment found, keep the line intact
                processedLines.push(line);
            }
        }
        
        result = processedLines.join('\n');
    }

    if (type === 'block' && config.block) {
        // Remove block comments while preserving context
        for (const block of config.block) {
            const startEscaped = block.start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const endEscaped = block.end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            // Version that preserves the text around block comments
            const parts = [];
            let currentPos = 0;
            const blockRegex = new RegExp(`${startEscaped}[\\s\\S]*?${endEscaped}`, 'g');
            let match;
            
            while ((match = blockRegex.exec(result)) !== null) {
                // Add the text before the comment
                parts.push(result.substring(currentPos, match.index));
                currentPos = match.index + match[0].length;
            }
            // Add the text after the last comment
            parts.push(result.substring(currentPos));
            
            result = parts.join('');
        }
    }

    // Clean up excessive empty lines
    result = result.replace(/\n\s*\n\s*\n/g, '\n\n'); // 3+ lines empty -> 2
    result = result.replace(/\n\s*\n/g, '\n'); // 2 lines empty -> 1 (optional)
    
    // Remove trailing spaces at the end of lines
    result = result.replace(/[ \t]+$/gm, '');
    
    return result;
}

export function deactivate() { /* TODO document why this function 'deactivate' is empty */ }
