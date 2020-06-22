import React, {Component} from 'react'
import {render} from 'react-dom'

// const ColTree =  require('../../src/index.js').ColTree

// const Taxon =  require('../../src/index.js').Taxon

import {Tree , Taxon, Search} from '../../src'

import history from '../../src/history'

class Demo extends Component {
  render() {
    const {location: path} = history;
    return <div>
      <h1>col-tree-browser Demo</h1>
     
     
        <React.Fragment>
       {path.pathname === '/data/tree' && <Tree catalogueKey={"3LR"} pathToTaxon="/data/taxon/"/>}
       {  path.pathname.indexOf('/data/taxon/') === 0 && <Taxon catalogueKey={"3LR"} pathToTree="/data/tree"></Taxon> }
       {  path.pathname.indexOf('/data/search') === 0 && <Search catalogueKey={"3LR"} pathToTaxon="/data/taxon/"></Search> }

       </React.Fragment>
   
    </div>
  }
}

render(<Demo/>, document.querySelector('#demo'))
