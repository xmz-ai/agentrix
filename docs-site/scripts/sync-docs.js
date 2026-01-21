#!/usr/bin/env node

/**
 * Sync docs from ../docs to website/docs and website/i18n
 * Automatically copies docs for both English and Chinese locales
 */

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

const ROOT_DIR = path.join(__dirname, '../..');
const DOCS_SOURCE = path.join(ROOT_DIR, 'docs');
const WEBSITE_DIR = path.join(__dirname, '..');
const DOCS_TARGET = path.join(WEBSITE_DIR, 'docs');
const I18N_DIR = path.join(WEBSITE_DIR, 'i18n');

/**
 * Fix MDX compilation issues in markdown files
 * Escapes characters that look like JSX tags
 */
async function fixMdxIssues(filePath) {
  let content = await fs.readFile(filePath, 'utf-8');

  // Fix <number patterns (e.g., <500ms, <90%)
  // Replace with escaped version or code formatting
  content = content.replace(/<(\d+)/g, '&lt;$1');

  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Process all markdown files in a directory
 */
async function processMarkdownFiles(dir) {
  const files = glob.sync('**/*.md', { cwd: dir, absolute: true });
  for (const file of files) {
    await fixMdxIssues(file);
  }
}

async function syncDocs() {
  console.log('🔄 Syncing documentation...');

  // Clean existing docs
  await fs.remove(DOCS_TARGET);
  await fs.ensureDir(DOCS_TARGET);

  // Copy English docs (en/)
  const enSource = path.join(DOCS_SOURCE, 'en');
  if (await fs.pathExists(enSource)) {
    console.log('📄 Copying English docs...');
    await fs.copy(enSource, DOCS_TARGET);
    await processMarkdownFiles(DOCS_TARGET);
    console.log('✅ English docs copied and processed');
  }

  // Copy Chinese docs (zh/) to i18n
  const zhSource = path.join(DOCS_SOURCE, 'zh');
  const zhTarget = path.join(I18N_DIR, 'zh', 'docusaurus-plugin-content-docs', 'current');
  if (await fs.pathExists(zhSource)) {
    console.log('📄 Copying Chinese docs...');
    await fs.remove(zhTarget);
    await fs.ensureDir(zhTarget);
    await fs.copy(zhSource, zhTarget);
    await processMarkdownFiles(zhTarget);
    console.log('✅ Chinese docs copied and processed');
  }

  // Copy README.md as index
  const readmeSource = path.join(DOCS_SOURCE, 'README.md');
  if (await fs.pathExists(readmeSource)) {
    const readmeTarget = path.join(DOCS_TARGET, 'index.md');
    await fs.copy(readmeSource, readmeTarget);
    await fixMdxIssues(readmeTarget);
    console.log('✅ README copied as index');
  }

  // Copy logo if exists
  const logoSource = path.join(ROOT_DIR, 'app', 'logo.png');
  const logoTarget = path.join(WEBSITE_DIR, 'static', 'img', 'logo.png');
  if (await fs.pathExists(logoSource)) {
    await fs.copy(logoSource, logoTarget);
    console.log('✅ Logo copied');
  }

  // Copy favicon if exists
  const faviconSource = path.join(ROOT_DIR, 'app', 'public', 'favicon.ico');
  const faviconTarget = path.join(WEBSITE_DIR, 'static', 'img', 'favicon.ico');
  if (await fs.pathExists(faviconSource)) {
    await fs.copy(faviconSource, faviconTarget);
    console.log('✅ Favicon copied');
  }

  console.log('✨ Documentation sync complete!');
}

syncDocs().catch(err => {
  console.error('❌ Error syncing docs:', err);
  process.exit(1);
});
