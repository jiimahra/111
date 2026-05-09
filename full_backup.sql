--
-- PostgreSQL database dump
--

\restrict hOqLoCgnGJDu85dbgi86NAfmQQWiyXj6RaIeAwm4Wr6lacBhpHfwUmMfnbHrUpP

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.requests DROP CONSTRAINT IF EXISTS requests_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.messages DROP CONSTRAINT IF EXISTS messages_to_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.messages DROP CONSTRAINT IF EXISTS messages_from_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.friend_requests DROP CONSTRAINT IF EXISTS friend_requests_to_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.friend_requests DROP CONSTRAINT IF EXISTS friend_requests_from_user_id_users_id_fk;
DROP INDEX IF EXISTS public.users_sahara_id_unique;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_unique;
ALTER TABLE IF EXISTS ONLY public.requests DROP CONSTRAINT IF EXISTS requests_pkey;
ALTER TABLE IF EXISTS ONLY public.messages DROP CONSTRAINT IF EXISTS messages_pkey;
ALTER TABLE IF EXISTS ONLY public.friend_requests DROP CONSTRAINT IF EXISTS friend_requests_pkey;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.requests;
DROP TABLE IF EXISTS public.messages;
DROP TABLE IF EXISTS public.friend_requests;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: friend_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.friend_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    from_user_id uuid NOT NULL,
    to_user_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.friend_requests OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    from_user_id uuid NOT NULL,
    to_user_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    read_at timestamp with time zone
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    category text NOT NULL,
    help_type text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    location text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    contact_phone text,
    posted_by text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.requests OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    name text NOT NULL,
    phone text,
    location text,
    reset_code text,
    reset_code_expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    sahara_id text NOT NULL,
    last_seen timestamp with time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: friend_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.friend_requests (id, from_user_id, to_user_id, status, created_at, updated_at) FROM stdin;
8c9bd6e7-0afe-466f-8fb5-57e4fe8e6c17	8cfdcad9-900a-4496-9d77-631114bf5b6c	2ae29daf-c58f-42a3-bdd4-1841bb658c0b	accepted	2026-05-06 18:53:53.932082+00	2026-05-06 18:54:47.46+00
c6978621-7908-4c45-bfe5-a3f5c71faa95	9a109eee-7c0f-4075-b5a7-de224f8520b2	2ae29daf-c58f-42a3-bdd4-1841bb658c0b	accepted	2026-05-06 18:38:11.153884+00	2026-05-07 07:04:15.794+00
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, from_user_id, to_user_id, content, created_at, read_at) FROM stdin;
c8e3e791-91df-450f-9e64-bbd99e70890a	2ae29daf-c58f-42a3-bdd4-1841bb658c0b	8cfdcad9-900a-4496-9d77-631114bf5b6c	Hi	2026-05-06 18:54:54.822874+00	2026-05-06 18:55:29.931+00
7b30c74b-2775-4602-a80d-dfd5fb775244	8cfdcad9-900a-4496-9d77-631114bf5b6c	2ae29daf-c58f-42a3-bdd4-1841bb658c0b	114592300	2026-05-06 18:55:34.111099+00	\N
\.


--
-- Data for Name: requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.requests (id, user_id, category, help_type, title, description, location, status, contact_phone, posted_by, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, name, phone, location, reset_code, reset_code_expires_at, created_at, sahara_id, last_seen) FROM stdin;
9a109eee-7c0f-4075-b5a7-de224f8520b2	test@example.com	$2b$10$jqiHF3V3Oh81.dYDAEeLN.S2fIgof/Q9dCo9aY28wi1wxIqi42/Qq	Test User	9999999999	Ajmer	888060	2026-05-06 18:11:54.055+00	2026-05-06 17:56:46.633139+00	847473304	\N
8cfdcad9-900a-4496-9d77-631114bf5b6c	nitinbhaibhai000@gmail.com	$2b$10$xRmDlCTNW9LXGyt75kRnbuA5EijUmp5Dq9lOXCrpBz.yNOXdzU3uu	Bhaiya		Ajmer	\N	\N	2026-05-06 18:42:08.612591+00	284890332	\N
06a5b8e8-625f-4f8c-905c-2c017180de37	idtest2@example.com	$2b$10$ksHdut4pVQV0u/zRJISShOkToZimwPmS9mf8G6ifxZ70wwhUT3p2y	Rahul Sharma	\N	Ajmer	\N	\N	2026-05-06 18:51:36.189623+00	316916694	\N
2ae29daf-c58f-42a3-bdd4-1841bb658c0b	nitinmahra0@gmail.com	$2b$10$gTSg7VwUaYJlIqdDyV20e.Ie46j6s5naxHQIpldSGzdkV0.M2d/Py	Nitin	7668192432	Ajmer	\N	\N	2026-05-06 18:29:36.45639+00	114592300	2026-05-07 07:04:20.1+00
\.


--
-- Name: friend_requests friend_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT friend_requests_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: requests requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users_sahara_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_sahara_id_unique ON public.users USING btree (sahara_id);


--
-- Name: friend_requests friend_requests_from_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT friend_requests_from_user_id_users_id_fk FOREIGN KEY (from_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: friend_requests friend_requests_to_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT friend_requests_to_user_id_users_id_fk FOREIGN KEY (to_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_from_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_from_user_id_users_id_fk FOREIGN KEY (from_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_to_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_to_user_id_users_id_fk FOREIGN KEY (to_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: requests requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict hOqLoCgnGJDu85dbgi86NAfmQQWiyXj6RaIeAwm4Wr6lacBhpHfwUmMfnbHrUpP

