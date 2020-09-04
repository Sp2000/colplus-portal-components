import React, {Component} from 'react'
import {render} from 'react-dom'

// const ColTree =  require('../../src/index.js').ColTree

// const Taxon =  require('../../src/index.js').Taxon

import {Tree , Taxon, Search, Dataset} from '../../src'

import history from '../../src/history'

class Demo extends Component {
  render() {
    const {location: path} = history;
    return <div>
      <h1>col-tree-browser Demo</h1>
     
     
        <React.Fragment>
       {path.pathname === '/data/tree' && <Tree catalogueKey={"3LR"} pathToTaxon="/data/taxon/" pathToDataset="/data/source/"/>}
       {  path.pathname.indexOf('/data/taxon/') === 0 && <Taxon catalogueKey={"3LR"} pathToTree="/data/tree" pathToSearch="/data/search" pathToDataset="/data/source/"></Taxon> }
       {  path.pathname.indexOf('/data/search') === 0 && <Search catalogueKey={"3LR"} pathToTaxon="/data/taxon/"></Search> }
       {  path.pathname.indexOf('/data/source') === 0 && <Dataset catalogueKey={"3LR"} pathToTree="/data/tree"></Dataset> }

       </React.Fragment>
   
    </div>
  }
}

render(<Demo/>, document.querySelector('#demo'))
