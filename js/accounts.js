// =================================================================================
// Accounts Page Logic
// This page uses localStorage as it's not tied to the proxy status KV store.
// =================================================================================

let accounts = [];
let editingAccountId = null;

document.addEventListener('DOMContentLoaded', () => {
    // Note: The shared app.js handles setup of common listeners like menus
    loadAccounts();
    renderAccounts();
    setupAccountEventListeners();
});

function setupAccountEventListeners() {
    document.getElementById('addAccountBtn').addEventListener('click', openAddModal);
    document.getElementById('emptyStateAddBtn').addEventListener('click', openAddModal);
    document.getElementById('cancelBtn').addEventListener('click', closeAccountModal);
    document.getElementById('accountForm').addEventListener('submit', saveAccount);
    document.getElementById('generateUuidBtn').addEventListener('click', () => {
        document.getElementById('uuid').value = crypto.randomUUID();
    });
}

function loadAccounts() {
    accounts = JSON.parse(localStorage.getItem('vpnAccounts') || '[]');
}

function saveAccounts() {
    localStorage.setItem('vpnAccounts', JSON.stringify(accounts));
}

function renderAccounts() {
    const tableBody = document.getElementById('accountsTableBody');
    const emptyState = document.getElementById('emptyState');
    emptyState.classList.toggle('hidden', accounts.length > 0);

    tableBody.innerHTML = accounts.map(account => `
        <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
            <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">${account.username}</td>
            <td class="px-6 py-4">
                <div class="flex items-center">
                    <span class="truncate w-48">${account.uuid}</span>
                    <button onclick="copyToClipboard('${account.uuid}', this)" class="ml-2 text-gray-500 hover:text-blue-600">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </td>
            <td class="px-6 py-4">${new Date(account.createdAt).toLocaleDateString()}</td>
            <td class="px-6 py-4">
                <button onclick="openEditModal('${account.id}')" class="font-medium text-blue-600 dark:text-blue-500 hover:underline mr-4">Edit</button>
                <button onclick="confirmDeleteAccount('${account.id}')" class="font-medium text-red-600 dark:text-red-500 hover:underline">Delete</button>
            </td>
        </tr>
    `).join('');
}

function openAddModal() {
    editingAccountId = null;
    document.getElementById('accountModalTitle').textContent = 'Add New Account';
    document.getElementById('accountForm').reset();
    document.getElementById('uuid').value = crypto.randomUUID();
    document.getElementById('accountModal').classList.remove('hidden');
}

function openEditModal(id) {
    const account = accounts.find(acc => acc.id === id);
    if (!account) return;
    editingAccountId = id;
    document.getElementById('accountModalTitle').textContent = 'Edit Account';
    document.getElementById('accountId').value = account.id;
    document.getElementById('username').value = account.username;
    document.getElementById('uuid').value = account.uuid;
    document.getElementById('accountModal').classList.remove('hidden');
}

function closeAccountModal() {
    document.getElementById('accountModal').classList.add('hidden');
}

function saveAccount(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const uuid = document.getElementById('uuid').value;
    if (editingAccountId) {
        const index = accounts.findIndex(acc => acc.id === editingAccountId);
        if (index !== -1) {
            accounts[index].username = username;
            accounts[index].uuid = uuid;
        }
    } else {
        accounts.push({
            id: crypto.randomUUID(),
            username,
            uuid,
            createdAt: new Date().toISOString()
        });
    }
    saveAccounts();
    renderAccounts();
    closeAccountModal();
}

function confirmDeleteAccount(id) {
    if (confirm('Are you sure you want to delete this account?')) {
        deleteAccount(id);
    }
}

function deleteAccount(id) {
    accounts = accounts.filter(acc => acc.id !== id);
    saveAccounts();
    renderAccounts();
}

function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const icon = button.querySelector('i');
        const originalIcon = 'fa-copy';
        const successIcon = 'fa-check';
        icon.classList.replace(originalIcon, successIcon);
        setTimeout(() => {
            icon.classList.replace(successIcon, originalIcon);
        }, 1500);
    }).catch(err => {
        console.error('Could not copy text: ', err);
    });
}

// Expose functions to be called from HTML onclick attributes
window.openEditModal = openEditModal;
window.confirmDeleteAccount = confirmDeleteAccount;
window.copyToClipboard = copyToClipboard;
