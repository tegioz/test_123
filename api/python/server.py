# test_123 API

# Server dependencies

from flask import Flask, redirect, send_from_directory, request
import json

# Flask app configuration

app = Flask(__name__)

# Load base json file

baseJSON = open("../common/base.json", "r").read()

# Setup routes

# Serve static content
@app.route("/<path:filename>", methods=["GET"])
def send_static(filename):
    return send_from_directory("../../ui/", filename)

# Test :-)
@app.route("/ping", methods=["GET"])
def ping():
    return "pong!"

# Redirect / to app (index.html)
@app.route("/", methods=["GET"])
def index():
    return redirect("/index.html")

# Serve data to clients
@app.route("/api/data", methods=["GET"])
def data():
    # Minimal data validation checking basic keys
    for key in ["shows", "regions", "show_regions"]:
        if key not in json.loads(baseJSON):
            return "Data not ready. Please try again later.", 503

    # Request parameters validation
    jsonpCallback = request.args.get("callback", "")
    if not jsonpCallback:
        return "Missing parameters", 400

    return "%s(%s);" % (jsonpCallback, baseJSON)

# Launch server

if __name__ == "__main__":
    app.debug = True
    app.run(host="127.0.0.1", port=8001)


