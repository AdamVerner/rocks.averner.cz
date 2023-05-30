import React from "react";

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
    <Map zoom={10} center={{ lat: 50.52, lng: 14.9 }} height={"100vh"}>
      <KeyboardControl />
      <ZoomControl />
      <MouseControl zoom={true} pan={true} wheel={true} />
      <CompassControl right={10} top={50} />
      <SyncControl />
      <MarkerLayer>
        {database.entries.map((e) => {
          const head = `<p>${e.grade} - <strong>${e.name} - (${e.rock})</strong></p>`;
          const body = `<p><a href="${e.link}" target="_blank">Source link</a></p><p>${e.description}</p>`;
          return (
            <Marker
              coords={{ lat: e.lat, lng: e.long }}
              card={{
                header: head,
                body: body,
              }}
            />
          );
        })}
      </MarkerLayer>
    </Map>
  );
};

export default RockMap;
