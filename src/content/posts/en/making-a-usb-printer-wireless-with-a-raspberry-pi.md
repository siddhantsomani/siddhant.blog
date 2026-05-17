---
title: "Making a USB printer wireless with a Raspberry Pi"
description: "I had a Brother laser printer with no Wi-Fi and a Raspberry Pi sitting on my network. An afternoon of CUPS later, I can print from my phone."
pubDate: 2026-05-17
tags: ["raspberry-pi", "printing", "cups", "home-lab"]
---

I have a Brother HL-L2320D. It's a perfectly good monochrome laser printer with one annoying quirk: no Wi-Fi. To print anything, you walk over with a USB cable, plug in a laptop, and remember which app you used last time. I don't love walking.

I also have a Raspberry Pi that lives on a shelf, plugged into the wall, doing approximately nothing most of the day. It's on my LAN. It's on my tailnet. It is, in every meaningful sense, a small computer waiting to be useful.

The plan more or less wrote itself: put the printer on the Pi, let the Pi do the wireless part. This is one of those classic Pi use cases that has existed for fifteen years, but I'd never actually set it up myself. So I did. Here's how it went.

## The mental model

The whole thing rests on one piece of software: **CUPS** — the Common Unix Printing System. CUPS is what macOS and most Linux desktops use to talk to printers under the hood. It runs as a local daemon, exposes an HTTP API (the IPP protocol) on port 631, and knows how to:

1. Take a print job from a client (a PDF, a PostScript stream, whatever).
2. Run it through the right driver (a PPD file describing how to encode pages for your specific printer).
3. Push the resulting bytes out a queue — over USB, over the network, wherever.

So if CUPS is already the thing your Mac uses to print, the trick to "wireless printing" is just: **run CUPS somewhere else, and point your Mac at it instead of at a local USB port.** The Pi runs CUPS, the Pi owns the USB cable, and every other device on the network talks to the Pi over IPP. The printer doesn't need to know it's on a network — as far as it's concerned, a Linux machine is sending it pages over USB the same way a laptop would.

Once you see it that way, the rest is plumbing.

## The setup, end to end

I'll skip the SSH-to-the-Pi part. Everything below runs on the Pi.

### 1. Install CUPS and the driver

CUPS itself was already on my Raspberry Pi OS install. The interesting part is the driver. Brother publishes proprietary `.deb` driver packages for Linux, and they mostly work, but for a long list of Brother lasers there's a much nicer option: **`brlaser`**, an open-source driver in Debian's repos.

```sh
sudo apt update
sudo apt install -y cups printer-driver-brlaser
```

This pulls in everything. After it finishes, you can list the PPDs CUPS knows about and grep for your model:

```sh
lpinfo -m | grep -i hl-l2320
# drv:///brlaser.drv/brl2320d.ppd  Brother HL-L2320D series, using brlaser v6
```

Exact match. The community has effectively reverse-engineered enough of Brother's protocol to drive these things directly, which is the kind of small miracle the open-source ecosystem hands you for free.

### 2. Let the Pi be a print server

CUPS, out of the box, is configured to be a single-user local printing system. We want it to act as a server: accept jobs over the network, share its printers, and let us administer it from the web UI on another machine. There's one command for that:

```sh
sudo cupsctl --remote-admin --remote-any --share-printers
sudo systemctl restart cups
```

`--remote-admin` opens the web UI to non-localhost. `--remote-any` allows connections from outside the local subnet (useful for Tailscale). `--share-printers` flips the Bonjour advertising bit, which is what makes the printer show up automatically on Macs and iPhones nearby.

Then I added myself to the `lpadmin` group so I can manage printers without `sudo` every time:

```sh
sudo usermod -aG lpadmin $USER
```

### 3. Find the printer and add the queue

Plug the printer in. Then:

```sh
sudo lpinfo -v | grep -i brother
# direct usb://Brother/HL-L2320D%20series?serial=U63877K1N741145
```

That URI is the magic string. Hand it to `lpadmin` along with the PPD you found earlier and a name:

```sh
sudo lpadmin \
  -p HL-L2320D \
  -v "usb://Brother/HL-L2320D%20series?serial=U63877K1N741145" \
  -m drv:///brlaser.drv/brl2320d.ppd \
  -E \
  -o printer-is-shared=true

sudo lpadmin -p HL-L2320D -o media=na_letter_8.5x11in   # I'm in the US; CUPS defaults to A4
lpoptions -d HL-L2320D                                  # make it the system default
```

That's it. A test print confirmed the Pi can drive the printer over USB:

```sh
echo "hello from the pi" | lp
```

A sheet came out. I felt the small, specific joy of having a computer do a physical thing on my behalf.

### 4. Add it to the Mac

CUPS on the Pi is now advertising the printer over Bonjour. On my Mac, **System Settings → Printers & Scanners → Add** picked it up automatically as `HL-L2320D @ raspberrypi`. The "Use" dropdown auto-selected the right driver. Clicked Add. Done.

iPhones see it the same way through AirPrint, no configuration needed.

## How I actually print things

A few options, in increasing order of effort and decreasing order of how often I use them:

```sh
# Any app on the Mac
File → Print

# From the Mac terminal
lpr report.pdf
lpr -P HL-L2320D report.pdf

# From any machine I can SSH to the Pi from (laptop, phone via Termius, etc.)
ssh siddhant@raspberrypi lp -t "$(basename report.pdf)" < report.pdf
```

I went back and forth on whether the SSH-pipe approach was clever or kludgy. My first instinct was to `scp` the file over and then `ssh ... lp /tmp/whatever.pdf`. That's worse: two SSH connections, a file left on the Pi, redundant I/O. `lp` reads stdin and spools the job straight into `/var/spool/cups/`, which is where the bytes were going to end up anyway. The pipe is the simpler primitive.

But the real answer is that once the printer is installed locally on my Mac, `lpr` over IPP is the cleanest path: no SSH, no shell, just the same protocol your apps use when you File → Print. SSH is for the edge case where I'm on a borrowed machine and don't want to install anything.

## Things I learned

A few things that didn't fit anywhere above:

- **CUPS is older than I thought.** It's from 1999. Apple bought it in 2007 and still maintains it. macOS prints through CUPS today; so does basically every Linux desktop. Once I internalized that "the print dialog on my Mac is talking IPP to a local CUPS daemon," the network-print version stopped feeling exotic. It's the same daemon, just on a different host.

- **Bonjour does a lot of heavy lifting.** I didn't have to type the Pi's IP anywhere on the Mac. The Pi advertises `_ipp._tcp` records over mDNS; the Mac sees them and offers the printer in the Add dialog. AirPrint is just this plus a couple of additional capabilities (like reporting paper sizes) over the same protocol. There's no proprietary magic — your Pi can speak AirPrint because it speaks IPP and Bonjour.

- **Tailscale doesn't extend Bonjour.** mDNS is link-local — it only travels on the LAN. If I want to print from outside my house, I'd add the printer manually using the Pi's tailnet IP and IPP. I haven't bothered yet because I'm rarely outside the house wanting to print something inside it, but the path is there if I ever want it.

- **The `brlaser` driver is a gift.** Brother does publish official Linux drivers, but they're a pile of `.deb` files per model and they age badly. The open-source equivalent, maintained out of love by a handful of people, ships with Debian and Just Works for ~30 Brother lasers. I'm always quietly impressed when I run into these little pockets of community-maintained infrastructure that have been keeping hardware alive for a decade.

The Pi is, finally, useful. The printer is, finally, wireless. The whole thing took an afternoon and zero new hardware. I'll think of something else to make the Pi do next weekend.
