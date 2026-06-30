import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');

const MULTILINE_STYLE_PATTERNS = [
  'styles.message',
  'styles.inputHint',
  'styles.hint',
  'styles.sectionSupport',
  'styles.statusMessage',
  'styles.errorText',
  'styles.helpAnswer',
  'styles.helpBody',
  'styles.instruction',
  'styles.instructions',
  'styles.description',
  'styles.subwelcome',
  'styles.librarySubtitle',
  'styles.panelBody',
  'styles.footerText',
  'styles.notice',
  'styles.subscriptionLanguageNotice',
  'styles.featureText',
  'styles.planFeature',
  'styles.questionText',
  'styles.questionBody',
  'styles.explanation',
  'styles.detailValue',
  'styles.authTagline',
  'styles.authSubtitle',
  'styles.modalBody',
  'styles.loadingBody',
  'styles.optionText',
  'styles.introText',
  'styles.faqText',
  'styles.inlineError',
  'styles.emptyText',
  'styles.performanceBannerBody',
  'styles.pageSubtitle',
  'styles.bannerSubtitle',
  'styles.fallbackNotice',
  'styles.helpIntro',
  'styles.signOutMessage',
  'styles.gateBody',
  'styles.gateMessage',
  'styles.testReview',
  'styles.resultSummary',
  'styles.planSummaryCaption',
];

const TWO_LINE_STYLE_PATTERNS = [
  'styles.methodLabel',
  'styles.choiceSubtitle',
  'styles.actionSubtitle',
  'styles.pathSubtitle',
  'styles.cardSubtitle',
  'styles.videoTitle',
  'styles.documentTitle',
  'styles.readingCardTitle',
  'styles.recommendationTitle',
  'styles.planTitle',
  'styles.historyTitle',
  'styles.detailTitle',
  'styles.detailExamTitle',
  'styles.inlineSignTitle',
  'styles.inlineSignBody',
  'styles.statLabel',
  'styles.contactLabel',
  'styles.contactValue',
  'styles.tableExam',
  'styles.tableResult',
  'styles.historyStatus',
];

function collectTsxFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'web-build' || entry.name === 'AppText.tsx') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectTsxFiles(full, acc);
    else if (entry.name.endsWith('.tsx') && !full.includes('YouTubePlayer')) acc.push(full);
  }
  return acc;
}

function relativeImport(fromFile, target = 'components/AppText.tsx') {
  const fromDir = path.dirname(fromFile);
  let rel = path.relative(fromDir, path.join(root, target)).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = `./${rel}`;
  return rel.replace(/\.tsx$/, '');
}

function migrateFile(filePath) {
  let src = fs.readFileSync(filePath, 'utf8');
  if (!src.includes('<Text') && !src.includes('<Text ')) return false;
  if (filePath.endsWith('AppText.tsx')) return false;

  const importPath = relativeImport(filePath);
  const importLine = `import { AppText } from '${importPath}';`;

  if (!src.includes("from '../components/AppText'") && !src.includes('from "./AppText"') && !src.includes(`from '${importPath}'`)) {
    const rnImport = src.match(/^import\s+\{([^}]+)\}\s+from\s+['"]react-native['"];?/m);
    if (rnImport) {
      const names = rnImport[1]
        .split(',')
        .map((s) => s.trim())
        .filter((name) => name && name !== 'Text');
      if (names.length === 0) {
        src = src.replace(rnImport[0], '');
      } else {
        src = src.replace(rnImport[0], `import { ${names.join(', ')} } from 'react-native';`);
      }
      src = `${importLine}\n${src}`;
    } else {
      src = `${importLine}\n${src}`;
    }
  }

  src = src.replace(/<Text\b/g, '<AppText');
  src = src.replace(/<\/Text>/g, '</AppText>');

  src = src.replace(/<AppText([^>]*?)\s+numberOfLines=\{(\d+)\}/g, '<AppText$1 lines={$2}');
  src = src.replace(/<AppText([^>]*?)\s+numberOfLines="(\d+)"/g, '<AppText$1 lines={$2}');

  for (const pattern of MULTILINE_STYLE_PATTERNS) {
    const re = new RegExp(`<AppText((?:(?!>).)*${pattern.replace('.', '\\.')}(?:(?!>).)*)>`, 'g');
    src = src.replace(re, (match, attrs) => {
      if (/\slines=/.test(attrs)) return match;
      return `<AppText${attrs} lines={null}>`;
    });
  }

  for (const pattern of TWO_LINE_STYLE_PATTERNS) {
    const re = new RegExp(`<AppText((?:(?!>).)*${pattern.replace('.', '\\.')}(?:(?!>).)*)>`, 'g');
    src = src.replace(re, (match, attrs) => {
      if (/\slines=/.test(attrs)) return match;
      return `<AppText${attrs} lines={2}>`;
    });
  }

  fs.writeFileSync(filePath, src);
  return true;
}

const files = collectTsxFiles(root);
let count = 0;
for (const file of files) {
  if (migrateFile(file)) {
    count += 1;
    console.log('migrated', path.relative(root, file));
  }
}
console.log(`Done. Migrated ${count} files.`);
