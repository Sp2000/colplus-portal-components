import React from "react";
import axios from "axios";
import {withRouter} from "react-router-dom";
import { Table, Alert, Radio, Row, Col, Button, Icon, Form } from "antd";
import config from "../config";
import qs from "query-string";
import history from "../history";
import Classification from "./Classification";
import SearchBox from "./SearchBox";
import MultiValueFilter from "./MultiValueFilter";
import RowDetail from "./RowDetail";
import _ from "lodash";
import ErrorMsg from "../components/ErrorMsg";
import NameAutocomplete from "../ColTree/NameAutocomplete";

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const PAGE_SIZE = 50;
const defaultParams = {
  limit: 50,
  offset: 0,
  facet: ["rank", "issue", "status", "nomstatus", "type", "field"],
  sortBy: "taxonomic"
};




const getColumns = (pathToTaxon) => [
  {
    title: "Scientific Name",
    dataIndex: "usage.labelHtml",
    key: "scientificName",
    render: (text, record) => {
      const id = record.usage.synonym ? _.get(record, 'usage.accepted.id') : _.get(record, 'usage.id')
      return (

          <a onClick={() => {window.location.href =  `${pathToTaxon}${id}`}}  dangerouslySetInnerHTML={{ __html: text }} />
      );
    },
    width: 200,
    sorter: true
  },
  {
    title: "Status",
    dataIndex: "usage.status",
    key: "status",
    width: 200,
    render: (text, record) => {
      return !["synonym", "ambiguous synonym", "misapplied"].includes(text) ? (
        text
      ) : (
        <React.Fragment key={_.get(record, "usage.id")}>
          {text} {text === "misapplied" ? "to " : "of "}
          <span
            dangerouslySetInnerHTML={{
              __html: _.get(record, "usage.accepted.labelHtml")
            }}
          />
        </React.Fragment>
      );
    }
  },
  {
    title: "Rank",
    dataIndex: "usage.name.rank",
    key: "rank",
    width: 60,
    sorter: true
  },
  {
    title: "Parents",
    dataIndex: "usage.classification",
    key: "parents",
    width: 180,
    render: (text, record) => {
      return !_.get(record, "classification") ? (
        ""
      ) : (
        <Classification
          key={_.get(record, "usage.id")}
          classification={_.initial(record.classification)}
          maxParents={2}
          datasetKey={_.get(record, "usage.name.datasetKey")}
          pathToTaxon={pathToTaxon}
        />
      );
    }
  }
];

class NameSearchPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      advancedFilters: false,
      columns: getColumns(this.props.pathToTaxon),
      params: {},
      pagination: {
        pageSize: PAGE_SIZE,
        current: 1,
        showQuickJumper: true
      },
      loading: false
    };
  }

  componentDidMount = () => {
    this.parseParamsAndGetData()
  }

  componentDidUpdate = (prevProps) => {
    const params = qs.parse(_.get(this.props, "location.search"));
    const prevParams = qs.parse(_.get(prevProps, "location.search"));
    if(!_.isEqual(params, prevParams)){
      this.parseParamsAndGetData()
    }
  }

  parseParamsAndGetData = () => {
    let params = qs.parse(_.get(this.props, "location.search"));
    if (_.isEmpty(params)) {
      params = defaultParams;
      this.pushParams(defaultParams)
    } else if (!params.facet) {
      params.facet = ["rank", "issue", "status", "nomstatus", "type", "field"];
    }

    this.setState({ params, pagination: {
      pageSize: Number(params.limit) || PAGE_SIZE,
      current: (Number(params.offset || 0) / Number(params.limit || PAGE_SIZE)) +1
      
    } }, this.getData);
  }

  pushParams = (params) => {
    if (!params.q) {
      delete params.q;
    }
    history.push({
      pathname: _.get(this.props, "location.path"), 
      search: `?${qs.stringify(params)}`
    });
  }

  getData = () => {
    const { params } = this.state;
    this.setState({ loading: true });
    const { catalogueKey } = this.props;
   
    const url =  `${config.dataApi}dataset/${catalogueKey}/nameusage/search`;
    axios(
      `${url}?${qs.stringify(
        params
      )}`
    )
      .then(res => {
        const pagination = { ...this.state.pagination };
        pagination.total = res.data.total;

        this.setState({
          loading: false,
          data: res.data,
          err: null,
          pagination
        });
      })
      .catch(err => {
        this.setState({ loading: false, error: err, data: [] });
      });
  };
  handleTableChange = (pagination, filters, sorter) => {
    const pager = { ...this.state.pagination };
    pager.current = pagination.current;

    this.setState({
      pagination: pager
    });
    let query = _.merge(this.state.params, {
      limit: pager.pageSize,
      offset: (pager.current - 1) * pager.pageSize,
      ...filters
    });

    if (sorter && sorter.field) {
      let split = sorter.field.split(".");

      if (split[split.length - 1] === "labelHtml") {
        query.sortBy = "name";
      } else if (split[split.length - 1] === "rank") {
        query.sortBy = "taxonomic";
      } else {
        query.sortBy = split[split.length - 1];
      }
    }
    if (sorter && sorter.order === "descend") {
      query.reverse = true;
    } else {
      query.reverse = false;
    }
    this.setState({ params: query }, () => this.pushParams(query));
  };

  updateSearch = params => {

    let newParams = {...this.state.params, offset: 0, limit: 50};
    _.forEach(params, (v, k) => {
      newParams[k] = v;
    });
    this.setState({ params: newParams}, () => this.pushParams(newParams));
  };
  

  resetSearch = () => {
    this.setState(
      {
        params: defaultParams
      },
      () => this.pushParams(defaultParams)
    );
  };

  toggleAdvancedFilters = () => {
    this.setState({ advancedFilters: !this.state.advancedFilters });
  };

  render() {
    const {
      data: { result, facets },
      loading,
      error,
      params,
      pagination,
      advancedFilters
    } = this.state;
    const {
      pathToTaxon,
      catalogueKey
    } = this.props;
    const facetRanks = _.get(facets, "rank")
      ? facets.rank.map(r => ({
          value: r.value,
          label: `${_.startCase(r.value)} (${r.count.toLocaleString('en-GB')})`
        }))
      : null;
    const facetIssues = _.get(facets, "issue")
      ? facets.issue.map(i => ({
          value: i.value,
          label: `${_.startCase(i.value)} (${i.count.toLocaleString('en-GB')})`
        }))
      : null;
    const facetTaxonomicStatus = _.get(facets, "status")
      ? facets.status.map(s => ({
          value: s.value,
          label: `${_.startCase(s.value)} (${s.count.toLocaleString('en-GB')})`
        }))
      : null;
    const facetNomStatus = _.get(facets, "nomstatus")
      ? facets.nomstatus.map(s => ({
          value: s.value,
          label: `${_.startCase(s.value)} (${s.count.toLocaleString('en-GB')})`
        }))
      : null;
    const facetNomType = _.get(facets, "type")
      ? facets.type.map(s => ({
          value: s.value,
          label: `${_.startCase(s.value)} (${s.count.toLocaleString('en-GB')})`
        }))
      : null;
    const facetNomField = _.get(facets, "field")
      ? facets.field.map(s => ({
          value: s.value,
          label: `${_.startCase(s.value)} (${s.count.toLocaleString('en-GB')})`
        }))
      : null;


    return (
      <div
      className="catalogue-of-life"

        style={{
          background: "#fff",
          padding: 24,
          minHeight: 280,
          margin: "16px 0"
        }}
      >
        <Row>
          {error && (
            <Alert
              style={{ marginBottom: "10px" }}
              message={<ErrorMsg error={error} />}
              type="error"
            />
          )}
        </Row>
        <Row>
          <Col
            span={12}
            style={{ display: "flex", flexFlow: "column", height: "165px" }}
          >
            <SearchBox
              defaultValue={_.get(qs.parse(_.get(this.props, "location.search")), "q")}
              onSearch={value => this.updateSearch({ q: value })}
              style={{ marginBottom: "10px", width: "100%" }}
            />
            <div style={{ marginTop: "10px" }}>
              {" "}
              <NameAutocomplete
                datasetKey={catalogueKey}
                onSelectName={value => {
                  this.updateSearch({ TAXON_ID: value.key });
                }}
                onResetSearch={this.resetSearch}
                placeHolder="Search by higher taxon"
                sortBy="TAXONOMIC"
                autoFocus={false}
                
              />{" "}
            </div>
            <div style={{ marginTop: "10px" }}>

<FormItem style={{
      marginLeft: "10px",
      marginBottom: "10px"
    }}>
    <RadioGroup
    
      onChange={evt => {
        if (typeof evt.target.value === "undefined") {
          this.setState(
            {
              params: _.omit(this.state.params, [
                "status"
              ])
            },
            this.getData
          );
        } else {
          this.updateSearch({ status: evt.target.value });
        }
      }}
      value={params.status}
    >
      <Radio value="_NOT_NULL">Exclude bare names</Radio>
      <Radio value="_NULL">Only bare names</Radio>
      <Radio value={undefined}>All</Radio>
    </RadioGroup>
    </FormItem>
    </div>
          </Col>
          <Col span={12}>
{/*             <MultiValueFilter
              defaultValue={_.get(params, "issue")}
              onChange={value => this.updateSearch({ issue: value })}
              vocab={facetIssues || []}
              label="Issues"
            /> */}

            <MultiValueFilter
              defaultValue={_.get(params, "rank")}
              onChange={value => this.updateSearch({ rank: value })}
              vocab={facetRanks || []}
              label="Ranks"
            />
            <MultiValueFilter
              defaultValue={_.get(params, "status")}
              onChange={value => this.updateSearch({ status: value })}
              vocab={facetTaxonomicStatus || []}
              label="Status"
            />
            {advancedFilters && (
              <React.Fragment>
                <MultiValueFilter
                  defaultValue={_.get(params, "nomstatus")}
                  onChange={value => this.updateSearch({ nomstatus: value })}
                  vocab={facetNomStatus || []}
                  label="Nomenclatural status"
                />
                <MultiValueFilter
                  defaultValue={_.get(params, "type")}
                  onChange={value => this.updateSearch({ type: value })}
                  vocab={facetNomType || []}
                  label="Name type"
                />
                <MultiValueFilter
                  defaultValue={_.get(params, "field")}
                  onChange={value => this.updateSearch({ field: value })}
                  vocab={facetNomField || []}
                  label="Name field"
                />
              </React.Fragment>
            )}
            <div style={{ textAlign: "right", marginBottom: "8px" }}>
              <a
                style={{ marginLeft: 8, fontSize: 12 }}
                onClick={this.toggleAdvancedFilters}
              >
                Advanced{" "}
                <Icon type={this.state.advancedFilters ? "up" : "down"} />
              </a>

              {/* <Switch checkedChildren="Advanced" unCheckedChildren="Advanced" onChange={this.toggleAdvancedFilters} /> */}
            </div>
          </Col>
        </Row>
        <Row>
          <Col span={12} style={{ textAlign: "left", marginBottom: "8px" }}>
            <Button type="danger" onClick={this.resetSearch}>
              Reset all
            </Button>
          </Col>
          <Col span={12} style={{ textAlign: "right", marginBottom: "8px" }}>
            {pagination &&
              !isNaN(pagination.total) &&
              `results: ${pagination.total.toLocaleString('en-GB')}`}
          </Col>
        </Row>
        {!error && (
          <Table
            size="small"
            columns={this.state.columns}
            dataSource={result}
            loading={loading}
            pagination={this.state.pagination}
            onChange={this.handleTableChange}
            rowKey={record => record.usage.id}
            expandedRowRender={record => <RowDetail {...record} catalogueKey={catalogueKey} pathToTaxon={pathToTaxon}/>}
          />
        )}
      </div>
    );
  }
}


export default withRouter(NameSearchPage);