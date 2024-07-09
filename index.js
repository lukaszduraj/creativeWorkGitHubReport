#!/usr/bin/env node
const fetch = require('node-fetch');
const fs = require('fs');

const token = process.env.NODE_AUTH_TOKEN;

if (!token) {
  console.error('Error: Please set the NODE_AUTH_TOKEN environment variable.');
  process.exit(1);
}

async function getGitHubUsername() {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching user information: ${response.statusText}`);
    }

    const data = await response.json();
    return data.login;
  } catch (error) {
    console.error('Error fetching GitHub username:', error.message);
    process.exit(1);
  }
}

function getPreviousMonth20thDate() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const year = currentMonth === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const date = new Date(year, previousMonth, 20);
  return date.toISOString().split('T')[0];
}

function getFileName() {
  const now = new Date();
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  const currentMonth = now.getMonth();
  const year = currentMonth === 0 ? now.getFullYear() - 1 : now.getFullYear();
  return `${monthNames[currentMonth]}-${year}.txt`;
}

async function getPullRequests(username) {
  const previousMonth20thDate = getPreviousMonth20thDate();
  try {
    const response = await fetch(`https://api.github.com/search/issues?q=author:${username}+type:pr+created:<=${previousMonth20thDate}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching pull requests: ${response.statusText}`);
    }

    const data = await response.json();
    const pullRequests = data.items;
    const sep = ';';

    const fileName = getFileName();
    const outputStream = fs.createWriteStream(fileName, { flags: 'w' });

    outputStream.write(`What was created/updated/changed/added/developed?${sep}Short description${sep}Link to specific documentation/confirmation (for example from Confluence, Jira, pull request on Github)\n`);
    pullRequests.forEach(pr => {
      const lineContent = `N/A${sep}${pr.title}${sep}${pr.html_url}`;
      console.log(lineContent);
      outputStream.write(lineContent+'\n');
    });

    outputStream.end();
    console.log(`Output written to ${fileName}`);
  } catch (error) {
    console.error('Error fetching pull requests:', error.message);
  }
}

async function creativeWorkReport() {
  const username = await getGitHubUsername();
  await getPullRequests(username);
}

creativeWorkReport();
