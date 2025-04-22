// Server configuration
const serverUrl = 'https://abaft-accidental-paste.glitch.me/';

console.log('Script loaded! Server URL:', serverUrl);

// Generate a random serial key starting with scriptxserial_
function generateKey() {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    
    const allChars = uppercase + lowercase + numbers;
    let key = 'scriptxserial_';
    
    // Generate exactly 37 random characters (50 - 13 for prefix)
    for (let i = 0; i < 37; i++) {
        key += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    return key;
}

// Update these functions in your script.js

// Check if serial key exists in database
async function checkSerialExists(serialKey) {
    try {
        console.log('Checking if serial exists:', serialKey);
        const response = await fetch(`${serverUrl}/api/check-serial`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ serial: serialKey }) // Changed back to 'serial' to match backend
        });
        
        console.log('Check response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to check serial');
        }
        
        const data = await response.json();
        console.log('Check response data:', data);
        return data.exists;
    } catch (error) {
        console.error('Error checking serial key:', error);
        throw error;
    }
}

// Save serial key to database
async function saveSerialKey(serialKey) {
    try {
        console.log('Attempting to save serial key:', serialKey);
        const response = await fetch(`${serverUrl}/api/save-serial`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ serial: serialKey }) // Changed back to 'serial' to match backend
        });
        
        console.log('Save response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save serial');
        }
        
        const data = await response.json();
        console.log('Save response data:', data);
        return data;
    } catch (error) {
        console.error('Error saving serial key:', error);
        throw error;
    }
}

// Generate a unique key and save it
async function generateAndSaveUniqueKey() {
    const key = generateKey();
    console.log('Generated key:', key);
    
    try {
        // Save the key directly
        await saveSerialKey(key);
        return key;
    } catch (error) {
        console.error('Error during save:', error);
        throw new Error('Failed to save the generated key');
    }
}

// Get the input element and set the key
const serialKeyInput = document.getElementById('serial-key');
if (serialKeyInput) {
    console.log('Found serial key input element');
    
    // Generate and save a unique key
    generateAndSaveUniqueKey()
        .then((key) => {
            console.log('Successfully generated and saved key:', key);
            serialKeyInput.value = key;
            
            // Add copy functionality
            serialKeyInput.onclick = function() {
                navigator.clipboard.writeText(key)
                    .then(() => {
                        alert('Key copied to clipboard!');
                    })
                    .catch(() => {
                        alert('Failed to copy key to clipboard');
                    });
            };
        })
        .catch((error) => {
            console.error('Error in generateAndSaveUniqueKey:', error);
            serialKeyInput.value = 'Error generating key. Please refresh.';
            alert('Failed to generate key: ' + error.message);
        });
} else {
    console.error('Could not find serial key input element');
}

// Validate serial key for download
async function validateDownloadKey(serialKey) {
    try {
        const response = await fetch(`${serverUrl}/api/validate-download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ serial: serialKey })
        });
        
        if (!response.ok) {
            throw new Error('Failed to validate key');
        }
        
        const data = await response.json();
        return data.valid;
    } catch (error) {
        console.error('Error validating download key:', error);
        return false;
    }
}

// Add event listeners for download validation
document.addEventListener('DOMContentLoaded', () => {
    const downloadInput = document.querySelector('.returning-customer input[type="text"]');
    const downloadButton = document.querySelector('.returning-customer .download-button');
    
    if (downloadInput && downloadButton) {
        let validationTimeout;
        
        downloadInput.addEventListener('input', async (e) => {
            const serialKey = e.target.value.trim();
            
            // Clear any existing timeout
            if (validationTimeout) {
                clearTimeout(validationTimeout);
            }
            
            // Disable button while validating
            downloadButton.disabled = true;
            
            // Wait for user to stop typing (500ms)
            validationTimeout = setTimeout(async () => {
                if (serialKey) {
                    const isValid = await validateDownloadKey(serialKey);
                    downloadButton.disabled = !isValid;
                } else {
                    downloadButton.disabled = true;
                }
            }, 500);
        });
        
        // Add click handler for download button
        downloadButton.addEventListener('click', () => {
            if (!downloadButton.disabled) {
                // Create a temporary link element to trigger the download
                const link = document.createElement('a');
                link.href = 'ScriptXDownloads/LatestVersion.zip';
                link.download = 'LatestVersion.zip';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        });
    }
});

// Validate users and handle registration
async function validateAndRegisterUsers(robloxUsername, discordUsername, reason) {
    try {
        console.log('Validating users:', { robloxUsername, discordUsername, reason });
        const response = await fetch(`${serverUrl}/api/validate-users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ robloxUsername, discordUsername, reason })
        });
        
        console.log('Validation response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to validate users');
        }
        
        const data = await response.json();
        console.log('Validation response data:', data);
        return data;
    } catch (error) {
        console.error('Error validating users:', error);
        throw error;
    }
}

// Add event listeners for registration
document.addEventListener('DOMContentLoaded', () => {
    const robloxInput = document.getElementById('roblox-username');
    const discordInput = document.getElementById('discord-username');
    const reasonInput = document.getElementById('reason');
    const robuxButton = document.getElementById('robuxButton');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const successMessage = document.getElementById('successMessage');
    const serialKeyDisplay = document.getElementById('serialKeyDisplay');
    const serialKey = document.getElementById('serialKey');
    const copyButton = document.getElementById('copyButton');

    if (robuxButton) {
        robuxButton.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const robloxUsername = robloxInput.value.trim();
            const discordUsername = discordInput.value.trim();
            const reason = reasonInput.value.trim();

            if (!robloxUsername || !discordUsername || !reason) {
                alert('Please enter all required fields');
                return;
            }

            loadingIndicator.style.display = 'block';

            try {
                const result = await validateAndRegisterUsers(robloxUsername, discordUsername, reason);
                
                if (result.success) {
                    successMessage.style.display = 'block';
                    serialKey.textContent = result.serialKey;
                    serialKeyDisplay.style.display = 'block';
                    
                    // Redirect to payment page after a short delay
                    setTimeout(() => {
                        window.location.href = 'https://www.roblox.com/game-pass/1168940060/ScriptXPurchase';
                    }, 2000);
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert('Registration failed: ' + error.message);
            } finally {
                loadingIndicator.style.display = 'none';
            }
        });
    }

    // Add copy to clipboard functionality
    if (copyButton) {
        copyButton.addEventListener('click', () => {
            const keyText = serialKey.textContent;
            navigator.clipboard.writeText(keyText)
                .then(() => {
                    copyButton.textContent = 'Copied!';
                    setTimeout(() => {
                        copyButton.textContent = 'Copy to Clipboard';
                    }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy text: ', err);
                    alert('Failed to copy serial key to clipboard');
                });
        });
    }
});