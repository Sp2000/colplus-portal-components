import React, {Component} from 'react'
import {render} from 'react-dom'

// const ColTree =  require('../../src/index.js').ColTree

// const Taxon =  require('../../src/index.js').Taxon

import {Tree , Taxon, Search, Dataset, DatasetSearch} from '../../src'

import history from '../../src/history'

class Demo extends Component {
  render() {
    const {location: path} = history;
    return <div style={{background: '#f2f3ed'}}>
      <h1>col-tree-browser Demo</h1>
     
     
        <React.Fragment>
       {path.pathname === '/data/tree' && <Tree catalogueKey={"3LR"} pathToTaxon="/data/taxon/" pathToDataset="/data/source/" defaultTaxonKey="36bf5b58-bc0c-4666-9692-73634d7b11d0"/>}
       {  path.pathname.indexOf('/data/taxon/') === 0 && <Taxon catalogueKey={"3LR"} pathToTree="/data/tree" pathToSearch="/data/search" pathToDataset="/data/source/" ></Taxon> }
       {  path.pathname.indexOf('/data/search') === 0 && <Search catalogueKey={"3LR"} pathToTaxon="/data/taxon/"></Search> }
       {  path.pathname.indexOf('/data/source') === 0 && <Dataset catalogueKey={"3LR"} pathToTree="/data/tree"></Dataset> }
       {  path.pathname.indexOf('/data/contributors') === 0 && <DatasetSearch catalogueKey={"3LR"} pathToDataset="/data/source/"></DatasetSearch> }

       </React.Fragment>
   
    </div>
  }
}

render(<Demo/>, document.querySelector('#demo'))
