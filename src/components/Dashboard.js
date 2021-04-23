import React, { Component } from "react";
import Loading from './Loading';
import Panel from './Panel';
import classnames from "classnames";
import axios from 'axios';
import {
  getTotalInterviews,
  getLeastPopularTimeSlot,
  getMostPopularDay,
  getInterviewsPerDay
 } from "helpers/selectors";
import { setInterview } from "helpers/reducers";

 
const data = [
  {
    id: 1,
    label: "Total Interviews",
    getValue: getTotalInterviews
  },
  {
    id: 2,
    label: "Least Popular Time Slot",
    getValue: getLeastPopularTimeSlot
  },
  {
    id: 3,
    label: "Most Popular Day",
    getValue: getMostPopularDay
  },
  {
    id: 4,
    label: "Interviews Per Day",
    getValue: getInterviewsPerDay
  }
];


class Dashboard extends Component {

  state = { 
    loading: true,
    focused: null,
    days:[],
    appointments:{},
    interviewers:{}
  };

  selectPanel(id) { 
    this.setState(prev => ({
      focused: prev.focused === null ? id : null
    }));
  }

  componentDidMount() {
    const focused = JSON.parse(localStorage.getItem("focused"));
    Promise.all([
      axios.get("/api/days"),
      axios.get("/api/appointments"),
      axios.get("/api/interviewers")
    ]).then(([days, appointments, interviewers]) => {
      this.setState({
        loading: false,
        days: days.data,
        appointments: appointments.data,
        interviewers: interviewers.data
      });
    });


    this.socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);

    this.socket.onmessage = event => {
      const data = JSON.parse(event.data);
      console.log(data)

      if (typeof data === 'object'  && data.type === 'SET_INTERVIEW'){
        this.setState(prev => setInterview(prev, data.id, data.interview))
      }
    }
    if (focused) {
      this.setState({ focused });
    }
  }

  componentDidUpdate(previousProps, previousState) {
    if (previousState.focused !== this.state.focused) {
      localStorage.setItem("focused", JSON.stringify(this.state.focused));
    }
  }

  componentWillUnmount() { 
    this.socket.close();
  }

  render() {
    const dashboardClasses = classnames("dashboard", {"dashboard--focused": this.state.focused});
    
    if(this.state.loading) { 
      return <Loading/>;
    };

    const panels = data.filter(panel => this.state.focused === null || this.state.focused === panel.id).map((element) => {
      return (<Panel 
        key={element.id} 
        id={element.id}
        label={element.label} 
        value={element.getValue(this.state)}
        onSelect={() => this.selectPanel(element.id)}
        />)
    });
    return  <main className={dashboardClasses}> {panels} </main>;
  }
}

export default Dashboard;
