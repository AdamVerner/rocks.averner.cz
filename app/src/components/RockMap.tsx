import React from "react";
import ReactDOM from "react-dom";

import database from "../data/database.json";

import {
  Map,
  MarkerLayer,
  Marker,
  SyncControl,
  CompassControl,
  MouseControl,
  ZoomControl,
  KeyboardControl,
} from "react-mapycz";
const RockMap = () => {
  return (
    <div>
      <Map center={{ lat: 50.556346, lng: 15.178015 }} height={"100vh"}>
        <KeyboardControl />
        <ZoomControl />
        <MouseControl zoom={true} pan={true} wheel={true} />
        <CompassControl right={10} top={50} />
        <SyncControl />
        <MarkerLayer>
          {database.entries.map((e) => (
            <Marker
              coords={{ lat: parseFloat(e.lat), lng: parseFloat(e.long) }}
              card={{
                header: "{e.grade}<strong>{e.name} - ({e.sector})</strong>",
                body: e.description,
                footer: "Card footer",
                options: {
                  width: 200,
                  height: 200,
                },
              }}
            />
          ))}
        </MarkerLayer>
      </Map>
    </div>
  );
};

export default RockMap;
