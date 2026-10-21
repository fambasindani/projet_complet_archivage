/* eslint-disable no-restricted-globals */
// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";
import Head from "../Composant/Head";
import Menus from "../Composant/Menus";
import FormDocument from "../Composant/FormDocument";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import { FaArrowLeft, FaFileAlt } from "react-icons/fa";
import { toast } from "../Composant/Toast";
import LoadingSpinner from "../Loading/LoadingSpinner";

const FormDocumentScreen = () => {
  const navRouter = useHistory();
  const token = GetTokenOrRedirect();

  const getCurrentId = () => {
    const match = window.location.pathname.match(/\/archive\/addform\/(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  };

  const id = getCurrentId();
  const isEditing = !!id;

  const [loading, setLoading] = useState(true);
  const [documentToEdit, setDocumentToEdit] = useState(null);
  const [divisions, setDivisions] = useState([]);
  const [emplacements, setEmplacements] = useState([]);
  const [classeurs, setClasseurs] = useState([]);
  const [typesDocuments, setTypesDocuments] = useState([]);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
        const [divisionsRes, emplacementsRes, classeursRes, typesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/divisions?per_page=100`, { headers }),
          axios.get(`${API_BASE_URL}/emplacements?per_page=100`, { headers }),
          axios.get(`${API_BASE_URL}/classeurs?per_page=100`, { headers }),
          axios.get(`${API_BASE_URL}/types-documents?per_page=100`, { headers }),
        ]);

        const divisionsPayload = divisionsRes.data?.data ?? divisionsRes.data;
        const divisionsData = Array.isArray(divisionsPayload) ? divisionsPayload : divisionsPayload?.data || [];
        setDivisions(divisionsData);
        setEmplacements(emplacementsRes.data?.data || []);
        setClasseurs(classeursRes.data?.data || []);
        setTypesDocuments(typesRes.data?.data || []);

        if (isEditing && id) {
          const archiveRes = await axios.get(`${API_BASE_URL}/archives/${id}`, { headers });
          setDocumentToEdit(archiveRes.data?.data || archiveRes.data);
        }
      } catch (error) {
        console.error("Erreur chargement formulaire document:", error);
        toast.error("Impossible de charger les données nécessaires");
        navRouter.push("/document");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, id, isEditing, navRouter]);

  const handleCancel = () => navRouter.push("/document");
  const handleSuccess = () => {
    toast.success(isEditing ? "Document modifié avec succès" : "Document créé avec succès");
    navRouter.push("/document");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f6fb]">
        <Menus />
        <Head />
        <div className="lg:pl-64">
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <button
              onClick={() => navRouter.push("/document")}
              className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <FaArrowLeft size={12} /> Retour
            </button>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
              <LoadingSpinner
                message={isEditing ? "Chargement du document..." : "Préparation du formulaire..."}
                subtitle="Veuillez patienter"
                size="lg"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <Menus />
      <Head />
      <div className="lg:pl-64">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-900 text-white">
                <FaFileAlt size={19} />
              </div>
              <div>
                <h1 className="font-display text-xl font-extrabold tracking-tight text-navy-900">
                  {isEditing ? "Modifier le document" : "Nouveau document"}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Formulaire aligné sur la table backend <code className="text-[11px]">archives</code>
                </p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <FaArrowLeft size={11} /> Retour
            </button>
          </div>

          <FormDocument
            isEditing={isEditing}
            documentToEdit={documentToEdit}
            onCancel={handleCancel}
            onSuccess={handleSuccess}
            divisions={divisions}
            emplacements={emplacements}
            classeurs={classeurs}
            typesDocuments={typesDocuments}
          />
        </div>
      </div>
    </div>
  );
};

export default FormDocumentScreen;
