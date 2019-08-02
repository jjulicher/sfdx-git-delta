const metadata = require('../metadata/v46')('directoryName');
const path = require('path')
const fse = require('fs-extra')

class StandardHandler {
  constructor(line,type,work) {
    this.changeType = line[0];
    this.line = line.replace(/^.\s*/,'');
    this.type = type;
    this.diffs = work.diffs;
    this.promises = work.promises;
    this.config = work.config;
    this.splittedLine = this.line.split(path.sep);

    this.handlerMap = {
      'A':this.handleAddtion,
      'M':this.handleModification,
      'R':this.handleRenaming,
      'D':this.handleDeletion
    }
  }
  
  handle(){
    !!this.handlerMap[this.changeType] && this.handlerMap[this.changeType].apply(this);
  }

  handleAddtion() {
    if(metadata[this.type].metaFile === true) {
      this.line = this.line.replace(StandardHandler.METAFILE_SUFFIX,'');
    }
    
    const source = path.join(this.config.repo,this.line);
    const target = path.join(this.config.output,this.line);
    
    this.promises.push(fse.copy(source, target));
    if(metadata[this.type].metaFile === true) {
      this.promises.push(fse.copy(source+StandardHandler.METAFILE_SUFFIX, target+StandardHandler.METAFILE_SUFFIX))
    }
  }

  handleModification() {
    this.handleAddtion.apply(this)
  }

  handleRenaming() {
    this.handleAddtion.apply(this)
    this.handleDeletion.apply(this)
  }

  handleDeletion(){
    if((metadata[this.type].metaFile === true && !this.line.endsWith(StandardHandler.METAFILE_SUFFIX)) || metadata[this.type].metaFile === false) {
      this.diffs[this.type] = this.diffs[this.type] || new Set();
      this.diffs[this.type].add(this.splittedLine[this.splittedLine.indexOf(this.type)+1].replace(StandardHandler.METAFILE_SUFFIX,'').replace(`.${metadata[this.type].suffix}`,''));
    }
  }
  
};

StandardHandler.METAFILE_SUFFIX = '-meta.xml';
module.exports = StandardHandler;