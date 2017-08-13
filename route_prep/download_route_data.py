import requests
import requests_cache
import os
import argparse
import json

requests_cache.install_cache("route_cache")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("trip_file", 
            help="Path to a file containing lines with six comma-separated values: src_id, src_lat, src_lng, dest_id, dest_lat, dest_lng")
    parser.add_argument("--geojson_file", default="trips.geojson",
            help="Path at which to write the resulting geojson data")
    args = parser.parse_args()

    geojson_data = {"type" : "FeatureCollection", "features" : []}
    with open(args.trip_file, "r") as handle:
        for line in handle:
            src_id, src_lat, src_lng, dest_id, dest_lat, dest_lng = line.strip().split(",")
            src_lat, src_lng, dest_lat, dest_lng = [float(v) for v in [src_lat, src_lng, dest_lat, dest_lng]]
            route_info = get_route(src_lat, src_lng, dest_lat, dest_lng, os.environ["BING_MAPS_API_KEY"])
            json_route_info = format_geojson(src_id, dest_id, route_info)
            geojson_data["features"].append(json_route_info)

    with open(args.geojson_file, "w+") as out_handle:
        json.dump(geojson_data, out_handle, indent=4)

def format_geojson(src_id, dest_id, route_info):
    route = route_info["resourceSets"][0]["resources"][0]
    #print(json.dumps(route, indent=4))
    return {
            "type" : "Feature",
            "properties" : {
                    "src_id" : src_id,
                    "dest_id" : dest_id,
                    "distanceUnit" : route["distanceUnit"],
                    "durationUnit" : route["durationUnit"],
                    "traveDistance" : route["travelDistance"],
                    "travelDuration" : route["travelDuration"],
                    "actualStart" : route["routeLegs"][0]["actualStart"],
                    "actualEnd" : route["routeLegs"][-1]["actualEnd"],
                },
            "geometry" : {
                    "type" : "LineString", 
                    "coordinates" : [[c[1], c[0]] for c in route["routePath"]["line"]["coordinates"]]
                }
        }


def get_route(src_lat, src_lng, dest_lat, dest_lng, api_key):
    route_response = requests.get("http://dev.virtualearth.net/REST/v1/Routes?wayPoint.1={0},{1}&wayPoint.2={2},{3}&routeAttributes=routePath&key={4}"
                                   .format(src_lat, src_lng, dest_lat, dest_lng, api_key))
    return route_response.json()

if __name__ == "__main__":
    main()



