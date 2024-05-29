const chalk = require('chalk');
const { post } = require('axios');
const { createWriteStream, createReadStream } = require('fs');
const archiver = require('archiver');
const uploadFolder = (folderPath) => {
    const output = createWriteStream(`${folderPath}.zip`);
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    // Read .gitignore file and add its contents to the archiver's ignore list
    const gitignorePath = `${folderPath}/.gitignore`;
    const ignoreFiles = [];
    if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        ignoreFiles.push(...gitignoreContent.split('\n').filter(line => line && !line.startsWith('#')));
    }

    output.on('close', async () => {
      try {
        const response = await post('https://portal.codebolt.ai/api/upload', {
          headers: {
            'Content-Type': 'application/zip',
          },
          data: createReadStream(`${folderPath}.zip`)
        });
        console.log(chalk.blue('Upload response:'), chalk.green(response.data));
      } catch (error) {
        console.error(chalk.red('Error uploading file:'), error);
      }
    });

    archive.on('error', (err) => { throw err; });
    archive.pipe(output);
    archive.glob('**/*', {
        cwd: folderPath,
        ignore: ignoreFiles
    });
    archive.finalize();
  };

module.exports = { uploadFolder };
