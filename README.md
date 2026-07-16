## Project Description

This project is an affordable tutor–student matching platform that connects students who need academic support with verified tutors who can teach specific subjects at flexible times and fair prices. The platform includes a student portal to search and book tutors, a tutor portal to create profiles and availability, and an admin dashboard to verify tutors, manage quality, and handle disputes.

Key features can include: tutor discovery (by subject, level, location/online), pricing visibility, scheduling, in-app chat, secure payments (optional), ratings/reviews, and learning progress tracking.

## Why It Needs to Be Solved

Many students struggle to access tutoring because:
Tutoring is often expensive, making it unavailable to many learners.
Students waste time finding trusted tutors through informal networks.
There is low transparency on tutor quality, pricing, and availability.
Tutors with real skills often lack an organized way to reach students.
Poor matching leads to ineffective learning (wrong tutor, wrong level, wrong schedule).
This creates a learning gap where students who need help the most are the least able to get it.

## How the Solution Solves It

The platform solves these challenges by:
Making tutoring affordable and transparent (clear prices, filters, and comparisons).
Matching students to the right tutors using subject, grade/level, budget, location, availability, and learning goals.
Improving trust and quality through tutor verification, reviews, and performance indicators.
Saving time with smart search, instant booking, and structured tutor profiles.
Supporting flexible learning through both online and in-person options (depending on implementation).
The result is faster access to the right support, better learning outcomes, and more opportunities for tutors.

## Problem Statement

Students who need academic support often face high tutoring costs, difficulty finding verified tutors, and inefficient matching based on subject, level, budget, and availability. As a result, many learners miss timely help, perform poorly, and become discouraged, while many capable tutors struggle to reach students consistently due to the lack of a trusted, structured platform.

## Frontend Testing

Run `npm test` for the automated frontend suite, `npm run test:coverage` for the HTML coverage report, and `npm run test:watch` during development. See `FRONTEND_TESTING.md` for the covered workflows, mock strategy, and contribution rules.

## Payment Experience

Course enrollment and confirmed student bookings share one secure checkout component. The component loads enabled methods from the backend, collects the mobile-money network and phone number when required, submits an idempotency key, and displays pending, paid, failed, expired, or refunded states.

The frontend polls the backend for status and never unlocks learning from a redirect or browser callback alone. Provider-confirmed payments expose a printable authenticated receipt. Local development may show the backend simulator, while production should expose Flutterwave mobile money only.

## Solution Summary

The proposed system is an affordable tutor–student matching platform that helps students quickly find and book verified tutors based on subject, academic level, budget, and availability. It provides transparent pricing, scheduling, communication tools, and quality control (verification and reviews) to build trust and improve outcomes. By organizing the tutoring process end-to-end, the platform reduces barriers to learning support and creates a reliable marketplace for both students and tutors.
