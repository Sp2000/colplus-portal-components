import React from "react";
import axios from "axios";
import { withRouter } from "react-router-dom";
import { UpOutlined, DownOutlined } from "@ant-design/icons";

import { Table, Alert, Switch,Checkbox, Row, Col, Button, Form, Radio } from "antd";
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
import DatasetAutocomplete from "../components/DatasetAutocomplete"
const FormItem = Form.Item;
const RadioGroup = Radio.Group;

const PAGE_SIZE = 50;
const defaultParams = {
  limit: 50,
  offset: 0,
  facet: ["rank", "issue", "status", "nomStatus", "nameType", "field"],
  sortBy: "taxonomic",
};

const getColumns = (pathToTaxon) => [
  {
    title: "Scientific Name",
    dataIndex: ["usage", "labelHtml"],
    key: "scientificName",
    render: (text, record) => {
      const id =
        _.get(record, "usage.accepted.id") || _.get(record, "usage.id");
      return (
        <a
          href={`${pathToTaxon}${id}`}
          onClick={() => {
            window.location.href = `${pathToTaxon}${id}`;
          }}
          dangerouslySetInnerHTML={{ __html: text }}
        />
      );
    },
    width: 200,
    sorter: true,
  },
  {
    title: "Status",
    dataIndex: ["usage", "status"],
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
              __html: _.get(record, "usage.accepted.labelHtml"),
            }}
          />
        </React.Fragment>
      );
    },
  },
  {
    title: "Rank",
    dataIndex: ["usage", "name", "rank"],
    key: "rank",
    width: 60,
    sorter: true,
  },
  {
    title: "Classification",
    dataIndex: ["usage", "classification"],
    key: "parents",
    width: 180,
    render: (text, record) => {
      return !_.get(record, "classification") ? (
        ""
      ) : (
        <Classification

          key={_.get(record, "usage.id")}
          classification={_.initial(record.classification)}
          truncate={true}
          datasetKey={_.get(record, "usage.name.datasetKey")}
          pathToTaxon={pathToTaxon}
        />
      );
    },
  },
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
        showQuickJumper: true,
        pageSizeOptions: [50, 100, 500, 1000],
      },
      loading: false,
    };
  }

  componentDidMount = () => {
    this.parseParamsAndGetData();
  };

  componentDidUpdate = (prevProps) => {
    const params = qs.parse(_.get(this.props, "location.search"));
    const prevParams = qs.parse(_.get(prevProps, "location.search"));
    if (!_.isEqual(params, prevParams)) {
      this.parseParamsAndGetData();
    }
  };
  getRank = () => {
    axios(`${config.dataApi}vocab/rank`).then((res) =>
      this.setState({ rank: res.data.map((r) => r.name) })
    );
  };
  parseParamsAndGetData = () => {
    let params = qs.parse(_.get(this.props, "location.search"));
    if (_.isEmpty(params)) {
      params = defaultParams;
      this.pushParams(defaultParams);
    } else if (!params.facet) {
      params.facet = [
        "rank",
        "issue",
        "status",
        "nomStatus",
        "nameType",
        "field",
      ];
    }

    if (!params.limit) {
      params.limit = PAGE_SIZE;
    }
    if (!params.offset) {
      params.offset = 0;
    }
    this.setState(
      {
        params,
        pagination: {
          pageSize: params.limit || PAGE_SIZE,
          current:
            Number(params.offset || 0) / Number(params.limit || PAGE_SIZE) + 1,
          showQuickJumper: true,
          pageSizeOptions: [50, 100, 500, 1000],
        },
      },
      this.getData
    );
  };

  pushParams = (params) => {
    if (!params.q) {
      delete params.q;
    }
    history.push({
      pathname: _.get(this.props, "location.path"),
      search: `?${qs.stringify(params)}`,
    });
  };

  getData = () => {
    const { params } = this.state;
    this.setState({ loading: true });
    const { catalogueKey } = this.props;

    const url = `${config.dataApi}dataset/${catalogueKey}/nameusage/search`;
    const params_ = _.get(params, "status")
      ? params
      : { ...params, status: "_NOT_NULL" };
    axios(`${url}?${qs.stringify(params_)}`)
      .then((res) => {
        const pagination = { ...this.state.pagination };
        pagination.total = res.data.total;

        this.setState({
          loading: false,
          data: res.data,
          err: null,
          pagination,
        });
      })
      .catch((err) => {
        this.setState({ loading: false, error: err, data: [] });
      });
  };
  handleTableChange = (pagination, filters, sorter) => {
    
    let query = _.merge(this.state.params, {
      limit: pagination.pageSize,
      offset: (pagination.current - 1) * pagination.pageSize,
      ...filters,
    });
    if (sorter && sorter.field) {
      if (sorter.field[sorter.field.length - 1] === "labelHtml") {
        query.sortBy = "name";
      } else if (sorter.field[sorter.field.length - 1] === "rank") {
        query.sortBy = "taxonomic";
      } else {
        query.sortBy = sorter.field[sorter.field.length - 1];
      }
    }
    if (sorter && sorter.order === "descend") {
      query.reverse = true;
    } else {
      query.reverse = false;
    }
    this.setState({ params: query }, () => this.pushParams(query));
  };

  updateSearch = (params) => {
    let newParams = { ...this.state.params, offset: 0, limit: 50 };
    _.forEach(params, (v, k) => {
      newParams[k] = v;
    });
    const notNullParams = Object.keys(newParams).reduce(
      (acc, cur) => (
        newParams[cur] !== null && (acc[cur] = newParams[cur]), acc
      ),
      {}
    );
    this.setState({ params: notNullParams }, () =>
      this.pushParams(notNullParams)
    );
  };

  resetSearch = () => {
    this.setState(
      {
        params: defaultParams,
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
      advancedFilters,
    } = this.state;
    const { pathToTaxon, catalogueKey } = this.props;
    const facetRanks = _.get(facets, "rank")
      ? facets.rank.map((r) => ({
          value: r.value,
          label: `${_.startCase(r.value)} (${r.count.toLocaleString("en-GB")})`,
        }))
      : null;
    const facetIssues = _.get(facets, "issue")
      ? facets.issue.map((i) => ({
          value: i.value,
          label: `${_.startCase(i.value)} (${i.count.toLocaleString("en-GB")})`,
        }))
      : null;
    const facetTaxonomicStatus = _.get(facets, "status")
      ? facets.status.map((s) => ({
          value: s.value,
          label: `${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
        }))
      : null;
    const facetNomStatus = _.get(facets, "nomStatus")
      ? facets.nomStatus.map((s) => ({
          value: s.value,
          label: `${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
        }))
      : null;
    const facetNomType = _.get(facets, "nameType")
      ? facets.nameType.map((s) => ({
          value: s.value,
          label: `${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
        }))
      : null;
    const facetNomField = _.get(facets, "field")
      ? facets.field.map((s) => ({
          value: s.value,
          label: `${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
        }))
      : null;

    return (
      <div
        className="catalogue-of-life"
        style={{
          padding: 24,
          minHeight: 280,
          margin: "16px 0",
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
        <Row >
          <Col xs={24} sm={24} md={12} style={{marginBottom: '8px'}}>
            <SearchBox
              defaultValue={_.get(
                qs.parse(_.get(this.props, "location.search")),
                "q"
              )}
              onSearch={(value) => this.updateSearch({ q: value })}
              onResetSearch={(value) => this.updateSearch({ q: null })}
              style={{ marginBottom: "8px", width: "100%" }}
            />

            <NameAutocomplete
              datasetKey={catalogueKey}
              minRank="GENUS"
              defaultTaxonKey={_.get(params, "TAXON_ID") || null}
              onSelectName={(value) => {
                this.updateSearch({ TAXON_ID: value.key });
              }}
              onResetSearch={(value) => {
                this.updateSearch({ TAXON_ID: null });
              }}
              placeHolder="Search by higher taxon"
              sortBy="TAXONOMIC"
              autoFocus={false}
            />


                  <div style={{ marginTop: "8px" , marginBottom: "8px"}}>
                    <DatasetAutocomplete
                      contributesTo={Number(catalogueKey)}
                      onSelectDataset={(value) => {
                        this.updateSearch({ SECTOR_DATASET_KEY: value.key });
                      }}
                      defaultDatasetKey={
                        _.get(params, "SECTOR_DATASET_KEY") || null
                      }
                      onResetSearch={(value) => {
                        this.updateSearch({ SECTOR_DATASET_KEY: null });
                      }}
                      placeHolder="Filter by source dataset"
                      autoFocus={false}
                    />
                  </div>
                  <div style={{ marginTop: "10px" }}>
              <Form layout="inline">
                <FormItem label="Fuzzy">
                  <Checkbox
                    checked={params.fuzzy === true || params.fuzzy === "true"}
                    onChange={({target: {checked}}) => this.updateSearch({ fuzzy: checked ? checked: null })}
                  />
                </FormItem>
                <FormItem label="Include extinct">
                  <Checkbox
                    checked={params.extinct !== false && params.extinct !== "false"}
                    onChange={({target: {checked}}) =>
                      this.updateSearch({ extinct: checked === false ? false : null })
                    }
                  />
                </FormItem>
                <FormItem label="Matching">
                  <RadioGroup
                    size="small"
                    onChange={(evt) => {
                      this.updateSearch({ type: evt.target.value });
                    }}
                    value={params.type || "WHOLE_WORDS"}
                    optionType="button"
                    options={[{value:"EXACT", label: "Exact" }, {value:"WHOLE_WORDS", label: "Words"}, {value:"PREFIX", label:"Prefix"} ]}
                  >
                   
                  </RadioGroup>
                </FormItem>
              </Form>
            </div>
               
          </Col>
          <Col xs={24} sm={24} md={12}>
            {/*             <MultiValueFilter
              defaultValue={_.get(params, "issue")}
              onChange={value => this.updateSearch({ issue: value })}
              vocab={facetIssues || []}
              label="Issues"
            /> */}

            <MultiValueFilter
              defaultValue={_.get(params, "rank")}
              onChange={(value) => this.updateSearch({ rank: value })}
              vocab={facetRanks || []}
              label="Ranks"
            />
            <MultiValueFilter
              defaultValue={_.get(params, "status")}
              onChange={(value) => this.updateSearch({ status: value })}
              vocab={facetTaxonomicStatus || []}
              label="Status"
            />
            {advancedFilters && (
              <React.Fragment>
                <MultiValueFilter
                  defaultValue={_.get(params, "nomstatus")}
                  onChange={(value) => this.updateSearch({ nomstatus: value })}
                  vocab={facetNomStatus || []}
                  label="Nomenclatural status"
                />
                <MultiValueFilter
                  defaultValue={_.get(params, "nameType")}
                  onChange={(value) => this.updateSearch({ nameType: value })}
                  vocab={facetNomType || []}
                  label="Name type"
                />
                <MultiValueFilter
                  defaultValue={_.get(params, "field")}
                  onChange={(value) => this.updateSearch({ field: value })}
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
                {this.state.advancedFilters ? <UpOutlined /> : <DownOutlined />}
              </a>

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
              `results: ${pagination.total.toLocaleString("en-GB")}`}
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
            rowKey={(record) => record.usage.id}
            showSorterTooltip={false}
            expandedRowRender={(record) => (
              <RowDetail
                {...record}
                catalogueKey={catalogueKey}
                pathToTaxon={pathToTaxon}
              />
            )}
          />
        )}
      </div>
    );
  }
}

export default withRouter(NameSearchPage);
