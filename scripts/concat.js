const fs = require('fs/promises')
const defaultFs = require('fs')
const path = require('path')

const traverseDirectory = async (dirPath, callback, options = {}) => {
	const { exclude = [], level = 0, prefix = '' } = options;
	let result = '';
	
	try {
		const entries = await fs.readdir(dirPath, { withFileTypes: true });
		entries.sort((a, b) => {
			if (a.isDirectory() && !b.isDirectory()) return -1;
			if (!a.isDirectory() && b.isDirectory()) return 1;
			return a.name.localeCompare(b.name);
		});

		const filteredEntries = entries.filter(entry => !exclude.includes(entry.name));

		for (let i = 0; i < filteredEntries.length; i++) {
			const entry = filteredEntries[i];
			const fullPath = path.join(dirPath, entry.name);
			const relativePath = path.relative(process.cwd(), fullPath);
			const isLast = i === filteredEntries.length - 1;
			const newPrefix = prefix + (isLast ? '└── ' : '├── ');
			
			result += prefix + (isLast ? '└── ' : '├── ') + entry.name + '\n';

			if (entry.isDirectory()) {
				const subPrefix = prefix + (isLast ? '    ' : '│   ');
				const subOptions = { exclude, level: level + 1, prefix: subPrefix };
				result += await traverseDirectory(fullPath, callback, subOptions);
			} else if (entry.isFile()) {
				try {
					const content = await fs.readFile(fullPath, 'utf8');
					await callback(relativePath, content);
				} catch (error) {
					console.error(`Ошибка при чтении файла ${fullPath}: ${error}`);
				}
			}
		}

		return result;
	} catch (error) {
		console.error(`Ошибка при обходе директории ${dirPath}: ${error}`);
		return result;
	}
}


const args = process.argv.slice(2);
const concatContentAndVisualizeFileStructure = async (
	dirPath = args[0],
	outFilename = args[1] || 'concatenated.txt'
) => {

	if (!dirPath) {
    console.error('Укажите путь к директории модуля первым аргументом');
    return;
  }

	dirPath = path.relative(process.cwd(), dirPath)
	if (!defaultFs.existsSync(dirPath)) {
    console.error(`Директория ${dirPath} не существует`);
    return;
  }
	
	const processFile = (filePath, content) => {
		const ncontent = `\n// ${filePath}\n` + content;
		fs.writeFile(outFilename, ncontent, { flag: 'a' })
		   .catch(error => console.error(`Ошибка при записи файла: ${error}`));
	};

	try {
		const excludeList = ['concat.js', 'node_modules', 'package-lock.json', '.env', 'yarn-lock.json', 'dist', outFilename];
		const structure = await traverseDirectory(dirPath, processFile, { exclude: excludeList });
		console.log(structure);
		console.log(`Контент модуля сконкатенирован в ${outFilename}`);	
		
	} catch (error) {
		console.error('Ошибка:', error);
	}
}

concatContentAndVisualizeFileStructure();