// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useHistory as useRouterHistory } from "react-router-dom";
import axios from "axios";
import Head from "../Composant/Head";
import Menus from "../Composant/Menus";
import FormNote from "../Composant/FormNote";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import { FaArrowLeft } from "react-icons/fa";
import { toast } from "../Composant/Toast";
import LoadingSpinner from "../Loading/LoadingSpinner";

const FormNoteScreen = () => {
  const navRouter = useRouterHistory();
  const token = GetTokenOrRedirect();

  const getCurrentId = () => {
    const match = window.location.pathname.match(/\/note\/form\/(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  };

  const id = getCurrentId();
  const isEditing = !!id;

  const [loading, setLoading] = useState(true);
  const [noteToEdit, setNoteToEdit] = useState(null);
  const [articles, setArticles] = useState([]);
  const [classeurs, setClasseurs] = useState([]);
  const [centres, setCentres] = useState([]);
  const [emplacements, setEmplacements] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
        const [articlesRes, classeursRes, centresRes, emplacementsRes, categoriesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/articleall`, { headers }),
          axios.get(`${API_BASE_URL}/classeur`, { headers }),
          axios.get(`${API_BASE_URL}/centre_ordonnancements/all?per_page=100`, { headers }),
          axios.get(`${API_BASE_URL}/emplacements?per_page=100`, { headers }),
          axios.get(`${API_BASE_URL}/categories-titres?per_page=100`, { headers }),
        ]);

        setArticles(articlesRes.data?.data || articlesRes.data || []);
        setClasseurs(classeursRes.data?.data || classeursRes.data || []);
        setCentres(centresRes.data?.data || centresRes.data || []);
        setEmplacements(emplacementsRes.data?.data || emplacementsRes.data || []);
        setCategories(categoriesRes.data?.data || categoriesRes.data || []);

        if (isEditing && id) {
          const titreRes = await axios.get(`${API_BASE_URL}/titres/${id}`, { headers });
          setNoteToEdit(titreRes.data?.data || titreRes.data);
        }
      } catch (error) {
        console.error("Erreur chargement formulaire titre:", error);
        toast.error("Impossible de charger les données du formulaire");
        setTimeout(() => navRouter.push("/note-perception"), 1200);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, id, isEditing, navRouter]);

  const handleCancel = () => navRouter.push("/note-perception");

  const handleSuccess = () => {
    toast.success(isEditing ? "Titre mis à jour avec succès" : "Titre créé avec succès");
    setTimeout(() => navRouter.push("/note-perception"), 900);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f6fb]">
        <Menus />
        <Head />
        <div className="lg:pl-64">
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <button
              onClick={() => navRouter.push("/note-perception")}
              className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <FaArrowLeft size={12} /> Retour
            </button>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
              <LoadingSpinner
                message={isEditing ? "Chargement du titre..." : "Préparation du formulaire..."}
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
      <div className="pb-24 pt-4 lg:pl-64">
        <FormNote
          isEditing={isEditing}
          noteToEdit={noteToEdit}
          onCancel={handleCancel}
          onSuccess={handleSuccess}
          articles={articles}
          classeurs={classeurs}
          centres={centres}
          emplacements={emplacements}
          categories={categories}
        />
      </div>
    </div>
  );
};

export default FormNoteScreen;
