import React from "react";
import config from "../config";
import axios from "axios";
const _ = require("lodash");

class TaxonomicCoverage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: [],
      groups: {},
      selectedGroup: "default",
      loading: false,
    };
  }

  componentDidMount() {
    this.getData();
  }

  getData = () => {
    const { dataset, catalogueKey } = this.props;
    const taxonMap = {};
    axios(
      `${config.dataApi}dataset/${catalogueKey}/sector?limit=1000&subjectDatasetKey=${dataset.key}`
    ).then((res) => {
      return Promise.all(
        res.data.result.map((t) =>
          axios(
            `${config.dataApi}dataset/${catalogueKey}/nameusage/search?TAXON_ID=${t.target.id}&rank=${t.subject.rank}&q=${t.subject.name}`
          ).then((usages) => {
            const taxon = _.get(usages, "data.result[0]");
            if (taxon) {
              const path = taxon.classification
                .slice(1, taxon.classification.length - 1)
                .map((t) => t.name)
                .join(" > ");
              if (taxonMap[path]) {
                taxonMap[path].push(
                  taxon.classification[taxon.classification.length - 1]
                );
              } else {
                taxonMap[path] = [
                  taxon.classification[taxon.classification.length - 1],
                ];
              }
            }
          })
        )
      ).then(() => this.setState({ taxonMap }));
    });
  };

  render = () => {
    const { taxonMap } = this.state;
    const { style, pathToTree } = this.props;
    return taxonMap
      ? Object.keys(taxonMap).sort((a,b) => a.length - b.length).map((k) => (
          <div style={style} key={k}>
            <span>{k}{k !== "" ? ":" : ""}</span>{" "}
            {taxonMap[k].map((tx, idx) => (
              <React.Fragment key={idx}>
                  <a href={`${pathToTree}?taxonKey=${tx.id}`} onClick={() => {window.location.href =  `${pathToTree}?taxonKey=${tx.id}`}}  >{tx.name}</a>
                {idx !== taxonMap[k].length - 1 ? ", " : ""}
              </React.Fragment>
            ))}
          </div>
        ))
      : null;
  };
}

export default TaxonomicCoverage;
