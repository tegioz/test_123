test_123
===

Not a great title/description, I know ;-)

### Get the code:

    git clone https://github.com/tegioz/test_123.git

### Test1:

Only client side app, no application server running.

    cd test_123/ui
    python -m SimpleHTTPServer (requires Python installed in the system)
    Open http://localhost:8000 in your browser

### Test2:

Client side app + Node.js backend serving jsonp data. In this case the backend will serve also the static content, but it's fine too to use the url mentioned in test1, as the application will start using data served locally as soon as the application server is up.

Setup (requires Node.js and npm installed in the system):

    cd test_123/api/nodejs
    npm install (install server dependencies)

Launch server:

    node server.js

After that the service should be running on http://localhost:8001. It will serve the client application if we use that url directly (using / or /index.html), but it will also provide data to the previous version that we launched using SimpleHttpServer if we refresh it.

### Test3:

Client side app + Python (Flask) backend serving jsonp data. As in the previous test, the backend will serve the static files of the app too when using / (redirect to index.html) or /index.html. The static resources are shared between all tests (resources in ui directory).

Setup (requires Python, virtualenv and pip installed in the system):

    cd test_123/api/python
    virtualenv ve
    source ve/bin/activate
    pip install -r requirements.txt

Launch server:

    python server.py

This server will be listening in the same addr/port than the previous one, so only one should be running at the same time.

### The end!



