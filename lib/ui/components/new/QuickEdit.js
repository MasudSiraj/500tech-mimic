import React from 'react';
import _ from 'lodash';
import HttpStatus from 'http-status-codes';
import { getHeaderPreset } from 'api/utils/headers';
import tuneIcon from 'ui/assets/images/tune@2x.png';
import stopwatchIcon from 'ui/assets/images/stopwatch@2x.png';
import leftIcon from 'ui/assets/images/left@2x.png';
import rightIcon from 'ui/assets/images/right@2x.png';
import Select from 'ui/components/new/common/Select';
import RequestOption from 'ui/components/new/common/RequestOption';
import RequestOptionValue from 'ui/components/new/common/RequestOptionValue';
import styled from 'styled-components';

const Checkbox = styled.input`
  margin-right: 5px;
`;

const ResponseEditor = styled.input`
  border: none;
  width: 100%;
  height: 100%;
  fontSize: 12px;
  padding: 0 6px;
  outline: 0;
  
  &:focus {
     box-shadow: inset 0 0 0px 2px #b2caef;
  }
`;

const containerStyle = {
  display: 'flex',
  position: 'fixed',
  bottom: '0',
  width: '100%',
  zIndex: '999999999999',
  backgroundColor: 'white',
  borderTop: '1px solid #e7e7e7',
  fontSize: '14px',
  height: '25px',
  fontFamily: 'Arial, sans-serif'
};

const sectionStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '0 6px',
  borderRight: '1px solid #e7e7e7',
  height: '100%'
};

const responseBodySectionStyle = Object.assign({}, sectionStyle, {
  padding: 0,
  flexGrow: 1
});

const arrowSectionStyle = Object.assign({}, sectionStyle, {
  cursor: 'pointer'
});

const disabledArrowSectionStyle = Object.assign({}, sectionStyle, {
  cursor: 'default'
});

const applyButtonStyle = {
  color: 'white',
  backgroundColor: '#2d7bd1',
  display: 'inline-block',
  padding: '3px 8px',
  marginRight: '20px',
  borderRadius: '4px',
  fontSize: '12px',
  cursor: 'pointer'
};

const iconStyle = {
  height: '16px',
  userSelect: 'none',
  margin: '0 5px'
};

const disabledIconStyle = Object.assign({}, iconStyle, {
  opacity: '0.3'
});

const delayPreset = [
  { value: 500, label: '0.5s' },
  { value: 1000, label: '1s' },
  { value: 2000, label: '2s' },
  { value: 5000, label: '5s' }
];

const headersPresetsOptions = [
  { value: 'JSON', label: 'JSON' },
  { value: 'XML', label: 'XML' },
  { value: 'TEXT', label: 'TEXT' }
];

class QuickEdit extends React.Component {
  constructor(props) {
    super(props);

    this.state = this.initRequest(props);

    this.selectRequest         = this.selectRequest.bind(this);
    this.selectPreviousRequest = this.selectPreviousRequest.bind(this);
    this.selectNextRequest     = this.selectNextRequest.bind(this);
    this.onChange              = this.onChange.bind(this);
    this.onRequestBodyChange   = this.onRequestBodyChange.bind(this);
    this.onCheckboxChange      = this.onCheckboxChange.bind(this);
    this.onSave                = this.onSave.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.selectedRequestId !== nextProps.selectedRequestId) {
      this.setState(this.initRequest(nextProps));
    }
  }

  initRequest(props) {
    const latestRequest = props.latestRequest;
    const mock = this.props.API.getMockedRequest(latestRequest.mockId);
    const delay         = _.get(mock, 'response.delay') || _.get(latestRequest, 'response.delay', 0);

    let delayOptions  = delayPreset;
    const delayOption = find(delayPreset, { value: delay });
    if (!delayOption) {
      delayOptions = [
        { value: delay, label: `${delay}ms` },
        ...delayPreset
      ];
    }

    return {
      status: _.get(mock, 'response.status') || _.get(latestRequest, 'response.status', 200),
      headerPreset: 'JSON',
      responseBody: _.get(mock, 'response.body') || _.get(latestRequest, 'response.body'),
      active: _.get(mock, 'active') || latestRequest.active,
      delay,
      delayOptions
    };
  }

  get selectedRequestIndex() {
    return _.findIndex(this.props.API.capturedRequests, {
      id: this.props.selectedRequestId
    });
  }

  get isFirstCapturedRequest() {
    return this.selectedRequestIndex === 0;
  }

  get isLastCapturedRequest() {
    return this.selectedRequestIndex === this.props.API.capturedRequests.length - 1;
  }

  selectRequest(value) {
    this.props.onSelectRequest(value);
  }

  selectPreviousRequest() {
    if (this.isFirstCapturedRequest) {
      return;
    }

    const previousRequest = this.props.API.capturedRequests[this.selectedRequestIndex - 1];

    this.props.onSelectRequest(previousRequest.id);
  }

  selectNextRequest() {
    if (this.isLastCapturedRequest) {
      return;
    }

    const nextRequest = this.props.API.capturedRequests[this.selectedRequestIndex + 1];

    this.props.onSelectRequest(nextRequest.id);
  }

  onChange(key) {
    return (value) => {
      this.setState({ [key]: value });
    };
  }

  onRequestBodyChange(event) {
    this.setState({
      responseBody: event.target.value
    });
  }

  onCheckboxChange(event) {
    this.setState({
      active: event.target.checked
    });
  }


  onSave() {
    const { latestRequest }                                     = this.props;
    const { delay, status, headerPreset, responseBody, active } = this.state;

    const request = Object.assign({}, latestRequest, {
      active,
      response: {
        delay,
        status,
        headers: getHeaderPreset(headerPreset),
        body: responseBody
      }
    });

    if (latestRequest.mockId) {
      this.props.API.updateMockedRequest('default-scenario', latestRequest.mockId, request);
    } else {
      this.props.API.mockRequest('default-scenario', request);
    }

    this.props.onSave();
  }

  render() {
    const capturedRequests = this.props.API.capturedRequests.map((request) => ({
        value: request.id,
        label: request.url,
        method: request.method
      }));

    return (
      <div style={ containerStyle }>
        <div style={ this.isFirstCapturedRequest ? disabledArrowSectionStyle : arrowSectionStyle }
             onClick={ this.selectPreviousRequest }>
          <img src={ leftIcon }
               style={ this.isFirstCapturedRequest ? disabledIconStyle : iconStyle }
               alt="Previous Request"/>
        </div>

        <div style={ this.isLastCapturedRequest ? disabledArrowSectionStyle : arrowSectionStyle }
             onClick={ this.selectNextRequest }>
          <img src={ rightIcon }
               style={ this.isLastCapturedRequest ? disabledIconStyle : iconStyle }
               alt="Next Request"/>
        </div>

        <div style={ sectionStyle }>
          <Select
            optionComponent={ RequestOption }
            valueComponent={ RequestOptionValue }
            onChange={ this.selectRequest }
            value={ this.props.selectedRequestId }
            options={ capturedRequests }/>
        </div>

        <div style={ sectionStyle }>
          <Checkbox type="checkbox" checked={ this.state.active } onChange={ this.onCheckboxChange }/>
          <Select
            onChange={ this.onChange('status') }
            value={ this.state.status }
            options={ _.values(HttpStatus).map((statusCode) => ({
              value: statusCode,
              label: statusCode
            })) }/>
        </div>

        <div style={ sectionStyle }>
          <Select
            onChange={ this.onChange('headerPreset') }
            value={ this.state.headerPreset }
            options={ headersPresetsOptions }/>
        </div>

        <div style={ responseBodySectionStyle }>
          <ResponseEditor type="text"
                 onChange={ this.onRequestBodyChange }
                 value={ this.state.responseBody }
                 placeholder="Response Body"/>
        </div>

        <div style={ sectionStyle }>
          <img src={ stopwatchIcon } style={ iconStyle } alt="Response Delay"/>
          <Select
            onChange={ this.onChange('delay') }
            value={ this.state.delay }
            options={ this.state.delayOptions }/>
        </div>

        <div style={ sectionStyle }>
          <div style={ applyButtonStyle }
               onClick={ this.onSave }>
            Apply
          </div>

          <img src={ tuneIcon } style={ iconStyle } alt="Tune Response"/>
        </div>
      </div>
    );
  }
}

export default QuickEdit;