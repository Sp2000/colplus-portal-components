import React from "react";
import _ from "lodash";
import BorderedListItem from "./BorderedListItem"
import ReferencePopover from "./ReferencePopover"
const SynonymsTable = ({ data, style, catalogueKey }) => {
  return (
    <div style={style}>
      {data
        .map(s => {
          return s[0] ? s[0] : s;
        })
        .map(s => (
          <BorderedListItem key={_.get(s, 'name.id')}>
            <span
              
            >
            {(_.get(s, 'name.homotypicNameId') && _.get(s, 'accepted.name.homotypicNameId') && _.get(s, 'accepted.name.homotypicNameId') === _.get(s, 'name.homotypicNameId') ) ? '≡ ' : '= '}  <span dangerouslySetInnerHTML={{ __html: _.get(s, 'labelHtml') }} /> {_.get(s, 'name.nomStatus') && `(${_.get(s, 'name.nomStatus')})`} {_.get(s, 'status') === 'misapplied' && _.get(s, 'accordingTo') ?  _.get(s, 'accordingTo') :''}
            </span> 
            {" "}
              <ReferencePopover datasetKey={catalogueKey} referenceId={s.referenceIds} placement="bottom"/>
          </BorderedListItem>
        ))}
    </div>
  );
};

export default SynonymsTable;