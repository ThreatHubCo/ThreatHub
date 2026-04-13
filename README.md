# ThreatHub ![ALPHA](https://img.shields.io/badge/ALPHA-orange)
[![Hits](https://hitcount.dev/p/threathubco/threathub.svg)](https://hitcount.dev/p/threathubco/threathub)

A multi-tenant vulnerability management platform for Microsoft Defender.

[Screenshots](https://imgur.com/a/threathub-screenshots-RQORD7t)

> [!NOTE]
> ThreatHub is in active development, and there may be breaking changes for a short while. If you intend to use this in production, please get in touch [via email](mailto:luke@glitch.je)

## What is this exactly?
ThreatHub was born after my experiences dealing with Microsoft Defender vulnerabilities while working at an MSP (Managed Service Provider).

We had email notifications come into our ticket system for 20+ clients which contained a subset of the latest CVEs but there was a lot of manual work I knew this wasn't the best solution so I sought to find a free alternative but couldn't, so I made it myself.

ThreatHub links to the Microsoft Defender API for each of your tenants and periodically fetches the latest vulnerability information (in fact it sync almost *everything* that Defender holds that is relevant) and allow you to access all this information in one place.

## Is this ready to use in production?
It is fully possible to use ThreatHub in production right now, depending on how you plan to use it. If you have existing processes in place then ThreatHub may be useful as an additional tool to make it easier to search information across multiple tenants in an instant.

It does have functionality to automatically escalate tickets to HaloPSA (more systems to come in the future), however this is not 100% finished and I would not recommend this functionality in production.

## How much does it cost?
Nothing - it's completely free! The project is licensed under the MIT License which is very permissive and allows you to do essentially whatever you want with the project. 

You can optionally support me via the following platforms:
- [GitHub Sponsors](https://github.com/sponsors/lukeeey)
- [Buy Me A Coffee](https://www.buymeacoffee.com/lukeeey)
- Have something else in mind? [Email me](mailto:luke@glitch.je)

## Setup guides
Some in-progress setup guides can be found at https://threathub.co

## Disclaimer
While a lot of the code was written by myself, I have used AI assistance in some areas - notably the more complicated SQL queries. I have checked these myself and tested in pre production for weeks. Remember, I'm just one person and this is a hobby project at the moment.