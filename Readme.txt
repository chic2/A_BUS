BusGo Demo — how to run it
===========================

This is a FAKE demo. No real payments, no real backend — everything
is stored in your browser's localStorage. It's meant to show the son
(and his parents) what a shared booking list could feel like.

FILES
-----
index.html   -> student side (sign up, log in, pick a day/bus, pick a
                seat, "pay" — instantly fake-confirmed, get a ticket)
admin.html   -> admin side (add buses, see every booking in one place,
                mark paid/pending, remove bookings or students, see
                total revenue)
storage.js   -> shared data logic (both pages read/write the same data)
style.css    -> shared look and feel

IMPORTANT: run it with a local server, don't just double-click the files
------------------------------------------------------------------------
Browsers often block localStorage from being shared between files when
you open them directly (file://...). To make sure index.html and
admin.html see the SAME data, run a tiny local server from inside this
folder:

  Option A (if you have Python installed):
    python3 -m http.server 8000
  Then open in your browser:
    http://localhost:8000/index.html
    http://localhost:8000/admin.html

  Option B (VS Code):
    Install the "Live Server" extension, right-click index.html,
    choose "Open with Live Server".

ADMIN LOGIN (demo only)
------------------------
Username: admin
Password: admin123

WHAT TO SHOW HIM
-----------------
1. Open admin.html, log in, add a bus (day, plate number, capacity, price).
2. Open index.html in another tab, sign up as a fake student, pick that
   day, pick the bus, pick a seat, hit pay — you'll get a ticket instantly.
3. Go back to admin.html and refresh — you'll see that booking show up
   in ONE place, with a Paid/Pending toggle. No WhatsApp, no duplicates,
   no separate admins seeing different things.

WHAT'S NOT REAL YET
--------------------
- Payment is fake — clicking "Pay" just marks the booking as paid
  instantly, no actual money moves.
- No live bus tracking yet.
- No SMS/email verification yet.
This is only meant to get his reaction to the booking flow and layout —
everything else comes after he gives feedback.