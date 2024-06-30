function formatBulletPointsAndBoldText(text) {
    // Replace lines starting with a hyphen followed by a space with bullet points
    let formattedText = text.replace(/^-\s/gm, '<li>');

    // Handle bold text within bullet points or numbered lines
    formattedText = formattedText.replace(/(<li>|\d+\.)\s*(\*\*.+?\*\*)/gm, '$1 <b>$2</b>');

    // General bold text handling
    formattedText = formattedText.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

    // Handle tables without bolding or highlighting inside
    const tableRegex = /(\|.+\|[\r\n|\n]+\|[-\s|:]+[\r\n|\n]+(?:\|.*\|[\r\n|\n]+)*)/gm;
    formattedText = formattedText.replace(tableRegex, (match) => {
    const rows = match.trim().split('\n').map(row => row.trim().split('|').filter(cell => cell.trim() !== ''));
    let tableHTML = '<table border="1" style="width:100%; border-collapse: collapse;">';
    rows.forEach((cells, index) => {
        tableHTML += '<tr>';
        cells.forEach(cell => {
            cell = cell.replace(/\*\*(.*?)\*\*/g, '$1'); // Remove bolding inside table cells
            tableHTML += `<td style="border: 1px solid #ddd; padding: 8px;">${cell.trim()}</td>`;
        });
        tableHTML += '</tr>';
    });
    tableHTML += '</table>';
    return tableHTML;
});

    return formattedText;
}


// JavaScript for Menu Button
const menuBtn = document.getElementById('menu-btn');
const menuList = document.getElementById('menu-list');

menuBtn.addEventListener('click', () => {
    const isOpen = menuList.style.left === '0px';
    menuList.style.left = isOpen ? '-300px' : '0px';
});

document.addEventListener("DOMContentLoaded", () => {
    const sendButton = document.getElementById("send-button");
    const promptInput = document.getElementById("prompt");
    const chatBox = document.getElementById("chat-box");
    const newChatButton = document.getElementById("new-chat-button");

    sendButton.addEventListener("click", sendMessage);

    promptInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            if (event.ctrlKey) {
                const cursorPosition = promptInput.selectionStart;
                promptInput.value = promptInput.value.slice(0, cursorPosition) + "\n" + promptInput.value.slice(cursorPosition);
                promptInput.selectionEnd = cursorPosition + 1;
            } else {
                event.preventDefault();
                sendMessage();
            }
        }
    });

    async function sendMessage() {
        const prompt = promptInput.value.trim();
        if (prompt === '') return;

        sendButton.disabled = true;

        const userMessage = document.createElement('div');
        userMessage.classList.add('message', 'user');
        userMessage.innerText = prompt;
        chatBox.appendChild(userMessage);

        promptInput.value = '';

        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('message', 'bot', 'typing-indicator');
        typingIndicator.innerHTML = `
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
        `;
        chatBox.appendChild(typingIndicator);

        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            const response = await fetch('https://11pwcqff-3000.inc1.devtunnels.ms/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            chatBox.removeChild(typingIndicator);

            let formattedResponse = data.response;

            // Process the bot's response to highlight code and add a copy button
            formattedResponse = formattedResponse.replace(/```([^```]+)```/g, (match, p1) => {
                const escapedCode = p1.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                return `<div class="code-container" style="position: relative;"><pre><code>${escapedCode}</code></pre><button class="copy-button" style="margin-right: 5px; font-size: 16px;">📋copy code</button></div>`;
            });
            formattedResponse = formattedResponse.replace(/\*\*([^*]+)\*\*/g, '<br><b>$1</b><br>');
            formattedResponse = formattedResponse.replace(/##(\S+)/g, '<br><strong>$1</strong><br>');
           // Transform sentences starting and ending with a hyphen into bullet points with line break
           formattedResponse = formatBulletPointsAndBoldText(formattedResponse);

            formattedResponse = formattedResponse.replace(/\*([^*])/g, '<br>$1');

            // Bold text handling with line breaks
            formattedResponse = formattedResponse.replace(/^(\d+\.|-)\s*(\*\*.+?\*\*)/gm, '$1<br><b>$2</b><br>'); // For lines with numbers or bullet points
            formattedResponse = formattedResponse.replace(/\*\*(.+?)\*\*/g, '<br><b>$1</b><br>'); // For other lines


            const botMessage = document.createElement('div');
            botMessage.classList.add('message', 'bot');
            botMessage.innerHTML = formattedResponse;
            chatBox.appendChild(botMessage);

            // Highlight the code using Prism.js
            Prism.highlightAll();

            // Add event listener to copy buttons
            document.querySelectorAll('.copy-button').forEach((button) => {
                button.addEventListener('click', (event) => {
                    const codeBlock = event.target.previousElementSibling;
                    const code = codeBlock.innerText;
                    navigator.clipboard.writeText(code).then(() => {
                        button.innerText = '✓ Copied!';
                        setTimeout(() => {
                            button.innerText = '📋 Copy code';
                        }, 2000);
                    });
                });
            });

        } catch (error) {
            console.error('Fetch error:', error);

            chatBox.removeChild(typingIndicator);

            const errorMessage = document.createElement('div');
            errorMessage.classList.add('message', 'bot');
            errorMessage.innerText = 'Error: ' + error.message;
            chatBox.appendChild(errorMessage);

            
            conversationHistory.push({ role: 'assistant', content: formattedResponse });
        }

        chatBox.scrollTop = chatBox.scrollHeight;
        sendButton.disabled = false;
    }
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    newChatButton.addEventListener("click", async () => {
        chatBox.innerHTML = '';
        promptInput.value = '';

        try {
            const response = await fetch('https://11pwcqff-3000.inc1.devtunnels.ms/reset', {
                method: 'POST'
            });
            if (!response.ok) {
                throw new Error('Failed to reset chat');
            }
        } catch (error) {
            console.error('Error resetting chat:', error);
        }
    });
});

// JavaScript for Dark Mode Toggle
const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;

darkModeToggle.addEventListener('click', toggleDarkMode);

function toggleDarkMode() {
    body.classList.toggle('dark-mode');
    darkModeToggle.textContent = body.classList.contains('dark-mode')
        ? '☀️ Light Mode'
        : '🌙 Dark Mode';

    localStorage.setItem('darkMode', body.classList.contains('dark-mode'));
}

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('darkMode') === 'true') {
        body.classList.add('dark-mode');
        darkModeToggle.textContent = '☀️ Light Mode';
    } else {
        darkModeToggle.textContent = '🌙 Dark Mode';
    }
});


