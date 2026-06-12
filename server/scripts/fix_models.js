import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsDir = path.join(__dirname, '..', 'models');

const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js'));

for (const file of files) {
  const filepath = path.join(modelsDir, file);
  let content = fs.readFileSync(filepath, 'utf8');
  let changed = false;

  // Fix broken regex: /^d{10}$/ → /^\d{10}$/
  if (content.includes('/^d{10}$/')) {
    content = content.replaceAll('/^d{10}$/', '/^\\d{10}$/');
    changed = true;
    console.log(`Fixed broken phone regex in ${file}`);
  }

  // Fix Institute.js: ref: "User" → ref: "SuperAdmin" (use refPath instead since creator can be SuperAdmin or Admin)
  if (file === 'Institute.js' && content.includes('ref: "User"')) {
    content = content.replace(
      `createdBy: {\n      type: mongoose.Schema.Types.ObjectId,\n      ref: "User",\n      default: null,\n    }`,
      `createdBy: {\n      type: mongoose.Schema.Types.ObjectId,\n      refPath: "createdByModel",\n      default: null,\n    },\n    createdByModel: {\n      type: String,\n      enum: ["SuperAdmin", "Admin"],\n      default: "SuperAdmin",\n    }`
    );
    changed = true;
    console.log(`Fixed createdBy ref in Institute.js`);
  }

  if (changed) {
    fs.writeFileSync(filepath, content, 'utf8');
  }
}

console.log('Done!');
