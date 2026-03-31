/**
 * PU IntelliQ - Question Paper Generator
 * Author: Surya Prakash
 */
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Download, 
  RefreshCw, 
  Settings, 
  BookOpen, 
  Layers, 
  ChevronRight,
  AlertCircle,
  Sparkles,
  Database,
  CheckCircle2,
  Plus,
  Trash2,
  FileDown,
  Wand2,
  LayoutGrid,
  ClipboardList
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { GoogleGenAI, Type } from "@google/genai";
import { Question, Part, QuestionType } from './types';
import { QUESTION_BANK } from './data/questions';
import { QuestionPaper } from './components/QuestionPaper';
import { cn } from './lib/utils';

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology", "Accountancy", "Business Studies", "Economics"];
const STREAMS = ["Science", "Commerce", "Arts"];
const CLASSES = ["I PU", "II PU"];

interface Chapter {
  name: string;
  subtopics: string[];
}

const CHAPTER_MAPPING: Record<string, Record<string, Chapter[]>> = {
  "I PU": {
    "Physics": [
      { name: "Units and Measurements", subtopics: ["The International System of Units", "Significant Figures", "Dimensions of Physical Quantities", "Dimensional Analysis"] },
      { name: "Motion in a Straight Line", subtopics: ["Position, Path Length and Displacement", "Average Velocity and Average Speed", "Instantaneous Velocity and Speed", "Acceleration", "Kinematic Equations"] },
      { name: "Motion in a Plane", subtopics: ["Scalars and Vectors", "Resolution of Vectors", "Vector Addition", "Motion in a Plane with Constant Acceleration", "Relative Velocity in Two Dimensions", "Projectile Motion", "Uniform Circular Motion"] },
      { name: "Laws of Motion", subtopics: ["Aristotle's Fallacy", "The Law of Inertia", "Newton's First Law of Motion", "Newton's Second Law of Motion", "Newton's Third Law of Motion", "Conservation of Momentum", "Equilibrium of a Particle", "Common Forces in Mechanics", "Circular Motion", "Solving Problems in Mechanics"] },
      { name: "Work, Energy and Power", subtopics: ["The Scalar Product", "Notions of Work and Kinetic Energy", "Work", "Kinetic Energy", "Work Done by a Variable Force", "The Work-Energy Theorem for a Variable Force", "The Concept of Potential Energy", "The Conservation of Mechanical Energy", "The Potential Energy of a Spring", "Various Forms of Energy: the Law of Conservation of Energy", "Power", "Collisions"] },
      { name: "System of Particles and Rotational Motion", subtopics: ["Centre of Mass", "Motion of Centre of Mass", "Linear Momentum of a System of Particles", "Vector Product of Two Vectors", "Angular Velocity and its Relation with Linear Velocity", "Torque and Angular Momentum", "Equilibrium of a Rigid Body", "Moment of Inertia", "Theorems of Perpendicular and Parallel Axes", "Kinematics of Rotational Motion about a Fixed Axis", "Dynamics of Rotational Motion about a Fixed Axis", "Angular Momentum in Case of Rotation about a Fixed Axis", "Rolling Motion"] },
      { name: "Gravitation", subtopics: ["Kepler's Laws", "Universal Law of Gravitation", "The Gravitational Constant", "Acceleration due to Gravity of the Earth", "Acceleration due to Gravity Below and Above the Surface of Earth", "Gravitational Potential Energy", "Escape Speed", "Earth Satellites", "Energy of an Orbiting Satellite", "Geostationary and Polar Satellites", "Weightlessness"] },
      { name: "Mechanical Properties of Solids", subtopics: ["Elastic Behaviour of Solids", "Stress and Strain", "Hooke's Law", "Stress-strain Curve", "Elastic Moduli", "Applications of Elastic Behaviour of Materials"] },
      { name: "Mechanical Properties of Fluids", subtopics: ["Pressure", "Streamline Flow", "Bernoulli's Principle", "Viscosity", "Reynolds Number", "Surface Tension"] },
      { name: "Thermal Properties of Matter", subtopics: ["Temperature and Heat", "Measurement of Temperature", "Ideal-gas Equation and Absolute Temperature", "Thermal Expansion", "Specific Heat Capacity", "Calorimetry", "Change of State", "Heat Transfer", "Newton's Law of Cooling"] },
      { name: "Thermodynamics", subtopics: ["Thermal Equilibrium", "Zeroth Law of Thermodynamics", "Heat, Internal Energy and Work", "First Law of Thermodynamics", "Specific Heat Capacity", "Thermodynamic State Variables and Equation of State", "Thermodynamic Processes", "Heat Engines", "Refrigerators and Heat Pumps", "Second Law of Thermodynamics", "Reversible and Irreversible Processes", "Carnot Engine"] },
      { name: "Kinetic Theory", subtopics: ["Molecular Nature of Matter", "Behaviour of Gases", "Kinetic Theory of an Ideal Gas", "Law of Equipartition of Energy", "Specific Heat Capacity", "Mean Free Path"] },
      { name: "Oscillations", subtopics: ["Periodic and Oscillatory Motions", "Simple Harmonic Motion", "Simple Harmonic Motion and Uniform Circular Motion", "Velocity and Acceleration in Simple Harmonic Motion", "Force Law for Simple Harmonic Motion", "Energy in Simple Harmonic Motion", "Some Systems Executing Simple Harmonic Motion", "Damped Simple Harmonic Motion", "Forced Oscillations and Resonance"] },
      { name: "Waves", subtopics: ["Transverse and Longitudinal Waves", "Displacement Relation in a Progressive Wave", "The Speed of a Travelling Wave", "The Principle of Superposition of Waves", "Reflection of Waves", "Beats", "Doppler Effect"] }
    ],
    "Chemistry": [
      { name: "Some Basic Concepts of Chemistry", subtopics: ["Importance of Chemistry", "Nature of Matter", "Properties of Matter and their Measurement", "Uncertainty in Measurement", "Laws of Chemical Combinations", "Dalton's Atomic Theory", "Atomic and Molecular Masses", "Mole Concept and Molar Masses", "Percentage Composition", "Stoichiometry and Stoichiometric Calculations"] },
      { name: "Structure of Atom", subtopics: ["Discovery of Sub-atomic Particles", "Atomic Models", "Developments Leading to the Bohr’s Model of Atom", "Bohr’s Model for Hydrogen Atom", "Towards Quantum Mechanical Model of the Atom", "Quantum Mechanical Model of Atom"] },
      { name: "Classification of Elements and Periodicity in Properties", subtopics: ["Genesis of Periodic Classification", "Modern Periodic Law and the present form of the Periodic Table", "Nomenclature of Elements with Atomic Numbers > 100", "Electronic Configurations of Elements and the Periodic Table", "Electronic Configurations and Types of Elements: s-, p-, d-, f- Blocks", "Periodic Trends in Properties of Elements"] },
      { name: "Chemical Bonding and Molecular Structure", subtopics: ["Kossel-Lewis Approach to Chemical Bonding", "Ionic or Electrovalent Bond", "Bond Parameters", "The Valence Shell Electron Pair Repulsion (VSEPR) Theory", "Valence Bond Theory", "Hybridisation", "Molecular Orbital Theory", "Hydrogen Bonding"] },
      { name: "States of Matter", subtopics: ["Intermolecular Forces", "Thermal Energy", "Intermolecular Forces vs Thermal Interactions", "The Gaseous State", "The Gas Laws", "Ideal Gas Equation", "Kinetic Molecular Theory of Gases", "Liquefaction of Gases", "Liquid State"] },
      { name: "Thermodynamics", subtopics: ["Thermodynamic Terms", "Applications", "Measurement of ΔU and ΔH: Calorimetry", "Enthalpy Change, ΔrH of a Reaction – Reaction Enthalpy", "Enthalpies for Different Types of Reactions", "Spontaneity", "Gibbs Energy Change and Equilibrium"] },
      { name: "Equilibrium", subtopics: ["Equilibrium in Physical Processes", "Equilibrium in Chemical Processes – Dynamic Equilibrium", "Law of Chemical Equilibrium and Equilibrium Constant", "Homogeneous Equilibria", "Heterogeneous Equilibria", "Applications of Equilibrium Constant", "Relationship between Equilibrium Constant K, Reaction Quotient Q and Gibbs Energy G", "Factors Affecting Equilibria", "Ionic Equilibrium in Solution", "Acids, Bases and Salts", "Ionization of Acids and Bases", "Buffer Solutions", "Solubility Equilibria of Sparingly Soluble Salts"] },
      { name: "Redox Reactions", subtopics: ["Classical Idea of Redox Reactions – Oxidation and Reduction Reactions", "Redox Reactions in Terms of Electron Transfer Reactions", "Oxidation Number", "Redox Reactions and Electrode Processes"] },
      { name: "Hydrogen", subtopics: ["Position of Hydrogen in the Periodic Table", "Dihydrogen, H2", "Preparation of Dihydrogen, H2", "Properties of Dihydrogen", "Hydrides", "Water", "Hydrogen Peroxide (H2O2)", "Heavy Water, D2O", "Dihydrogen as a Fuel"] },
      { name: "The s-Block Elements", subtopics: ["Group 1 Elements: Alkali Metals", "General Characteristics of the Compounds of the Alkali Metals", "Anomalous Properties of Lithium", "Some Important Compounds of Sodium", "Biological Importance of Sodium and Potassium", "Group 2 Elements: Alkaline Earth Metals", "General Characteristics of Compounds of the Alkaline Earth Metals", "Anomalous Behaviour of Beryllium", "Some Important Compounds of Calcium", "Biological Importance of Magnesium and Calcium"] },
      { name: "The p-Block Elements", subtopics: ["Group 13 Elements: The Boron Family", "Important Trends and Anomalous Properties of Boron", "Some Important Compounds of Boron", "Uses of Boron and Aluminium and their Compounds", "Group 14 Elements: The Carbon Family", "Important Trends and Anomalous Properties of Carbon", "Allotropes of Carbon", "Some Important Compounds of Carbon and Silicon"] },
      { name: "Organic Chemistry – Some Basic Principles and Techniques", subtopics: ["General Introduction", "Tetravalence of Carbon: Shapes of Organic Compounds", "Structural Representations of Organic Compounds", "Classification of Organic Compounds", "Nomenclature of Organic Compounds", "Isomerism", "Fundamental Concepts in Organic Reaction Mechanism", "Methods of Purification of Organic Compounds", "Qualitative Analysis of Organic Compounds", "Quantitative Analysis"] },
      { name: "Hydrocarbons", subtopics: ["Classification", "Alkanes", "Alkenes", "Alkynes", "Aromatic Hydrocarbon"] },
      { name: "Environmental Chemistry", subtopics: ["Environmental Pollution", "Atmospheric Pollution", "Water Pollution", "Soil Pollution", "Industrial Waste", "Strategies to control Environmental Pollution", "Green Chemistry"] }
    ],
    "Mathematics": [
      { name: "Sets", subtopics: ["Sets and their Representations", "The Empty Set", "Finite and Infinite Sets", "Equal Sets", "Subsets", "Power Set", "Universal Set", "Venn Diagrams", "Operations on Sets", "Complement of a Set", "Practical Problems on Union and Intersection of Two Sets"] },
      { name: "Relations and Functions", subtopics: ["Cartesian Product of Sets", "Relations", "Functions"] },
      { name: "Trigonometric Functions", subtopics: ["Angles", "Trigonometric Functions", "Trigonometric Functions of Sum and Difference of Two Angles", "Trigonometric Equations"] },
      { name: "Principle of Mathematical Induction", subtopics: ["Motivation", "The Principle of Mathematical Induction"] },
      { name: "Complex Numbers and Quadratic Equations", subtopics: ["Complex Numbers", "Algebra of Complex Numbers", "The Modulus and the Conjugate of a Complex Number", "Argand Plane and Polar Representation", "Quadratic Equations"] },
      { name: "Linear Inequalities", subtopics: ["Inequalities", "Algebraic Solutions of Linear Inequalities in One Variable and their Graphical Representation", "Graphical Solution of Linear Inequalities in Two Variables", "Solution of System of Linear Inequalities in Two Variables"] },
      { name: "Permutations and Combinations", subtopics: ["Fundamental Principle of Counting", "Permutations", "Combinations"] },
      { name: "Binomial Theorem", subtopics: ["Binomial Theorem for Positive Integral Indices", "General and Middle Terms"] },
      { name: "Sequence and Series", subtopics: ["Sequences", "Series", "Arithmetic Progression (A.P.)", "Geometric Progression (G.P.)", "Relationship Between A.M. and G.M.", "Sum to n Terms of Special Series"] },
      { name: "Straight Lines", subtopics: ["Slope of a Line", "Various Forms of the Equation of a Line", "Distance of a Point From a Line"] },
      { name: "Conic Sections", subtopics: ["Sections of a Cone", "Circle", "Parabola", "Ellipse", "Hyperbola"] },
      { name: "Introduction to Three Dimensional Geometry", subtopics: ["Coordinate Axes and Coordinate Planes in Three Dimensional Space", "Coordinates of a Point in Space", "Distance between Two Points", "Section Formula"] },
      { name: "Limits and Derivatives", subtopics: ["Intuitive Idea of Derivatives", "Limits", "Limits of Trigonometric Functions", "Derivatives"] },
      { name: "Mathematical Reasoning", subtopics: ["Statements", "New Statements from Old", "Special Words/Phrases", "Implications", "Validating Statements"] },
      { name: "Statistics", subtopics: ["Measures of Dispersion", "Range", "Mean Deviation", "Variance and Standard Deviation", "Analysis of Frequency Distributions"] },
      { name: "Probability", subtopics: ["Random Experiments", "Event", "Axiomatic Approach to Probability"] }
    ],
    "Biology": [
      { name: "The Living World", subtopics: ["What is ‘Living’?", "Diversity in the Living World", "Taxonomic Categories", "Taxonomical Aids"] },
      { name: "Biological Classification", subtopics: ["Kingdom Monera", "Kingdom Protista", "Kingdom Fungi", "Kingdom Plantae", "Kingdom Animalia", "Viruses, Viroids and Lichens"] },
      { name: "Plant Kingdom", subtopics: ["Algae", "Bryophytes", "Pteridophytes", "Gymnosperms", "Angiosperms", "Plant Life Cycles and Alternation of Generations"] },
      { name: "Animal Kingdom", subtopics: ["Basis of Classification", "Classification of Animals"] },
      { name: "Morphology of Flowering Plants", subtopics: ["The Root", "The Stem", "The Leaf", "The Inflorescence", "The Flower", "The Fruit", "The Seed", "Semi-technical Description of a Typical Flowering Plant", "Description of Some Important Families"] },
      { name: "Anatomy of Flowering Plants", subtopics: ["The Tissues", "The Tissue System", "Anatomy of Dicotyledonous and Monocotyledonous Plants", "Secondary Growth"] },
      { name: "Structural Organisation in Animals", subtopics: ["Animal Tissues", "Organ and Organ System", "Earthworm", "Cockroach", "Frogs"] },
      { name: "Cell: The Unit of Life", subtopics: ["What is a Cell?", "Cell Theory", "An Overview of Cell", "Prokaryotic Cells", "Eukaryotic Cells"] },
      { name: "Biomolecules", subtopics: ["How to Analyse Chemical Composition?", "Primary and Secondary Metabolites", "Biomacromolecules", "Proteins", "Polysaccharides", "Nucleic Acids", "Structure of Proteins", "Nature of Bond Linking Monomers in a Polymer", "Dynamic State of Body Constituents – Concept of Metabolism", "Metabolic Basis for Living", "The Living State", "Enzymes"] },
      { name: "Cell Cycle and Cell Division", subtopics: ["Cell Cycle", "M Phase", "Significance of Mitosis", "Meiosis", "Significance of Meiosis"] },
      { name: "Transport in Plants", subtopics: ["Means of Transport", "Plant-Water Relations", "Long Distance Transport of Water", "Transpiration", "Uptake and Transport of Mineral Nutrients", "Phloem Transport: Flow from Source to Sink"] },
      { name: "Mineral Nutrition", subtopics: ["Methods to Study the Mineral Requirements of Plants", "Essential Mineral Elements", "Mechanism of Absorption of Elements", "Translocation of Solutes", "Soil as Reservoir of Essential Elements", "Metabolism of Nitrogen"] },
      { name: "Photosynthesis in Higher Plants", subtopics: ["What do we know?", "Early Experiments", "Where does Photosynthesis take place?", "How many Pigments are involved in Photosynthesis?", "What is Light Reaction?", "The Electron Transport", "Where are the ATP and NADPH Used?", "The C4 Pathway", "Photorespiration", "Factors affecting Photosynthesis"] },
      { name: "Respiration in Plants", subtopics: ["Do Plants Breathe?", "Glycolysis", "Fermentation", "Aerobic Respiration", "The Respiratory Balance Sheet", "Amphibolic Pathway", "Respiratory Quotient"] },
      { name: "Plant Growth and Development", subtopics: ["Growth", "Differentiation, Dedifferentiation and Redifferentiation", "Development", "Plant Growth Regulators", "Photoperiodism", "Vernalisation"] },
      { name: "Digestion and Absorption", subtopics: ["Digestive System", "Digestion of Food", "Absorption of Digested Products", "Disorders of Digestive System"] },
      { name: "Breathing and Exchange of Gases", subtopics: ["Respiratory Organs", "Mechanism of Breathing", "Exchange of Gases", "Transport of Gases", "Regulation of Respiration", "Disorders of Respiratory System"] },
      { name: "Body Fluids and Circulation", subtopics: ["Blood", "Lymph (Tissue Fluid)", "Circulatory Pathways", "Double Circulation", "Regulation of Cardiac Activity", "Disorders of Circulatory System"] },
      { name: "Excretory Products and their Elimination", subtopics: ["Human Excretory System", "Urine Formation", "Function of the Tubules", "Mechanism of Concentration of the Filtrate", "Regulation of Kidney Function", "Micturition", "Role of other Organs in Excretion", "Disorders of the Excretory System"] },
      { name: "Locomotion and Movement", subtopics: ["Types of Movement", "Muscle", "Skeletal System", "Joints", "Disorders of Muscular and Skeletal System"] },
      { name: "Neural Control and Coordination", subtopics: ["Neural System", "Human Neural System", "Neuron as Structural and Functional Unit of Neural System", "Central Neural System", "Reflex Action and Reflex Arc", "Sensory Reception and Processing"] },
      { name: "Chemical Coordination and Integration", subtopics: ["Endocrine Glands and Hormones", "Human Endocrine System", "Hormones of Heart, Kidney and Gastrointestinal Tract", "Mechanism of Hormone Action"] }
    ]
  },
  "II PU": {
    "Physics": [
      { name: "Electric Charges and Fields", subtopics: ["Electric Charge", "Conductors and Insulators", "Charging by Induction", "Basic Properties of Electric Charge", "Coulomb’s Law", "Forces between Multiple Charges", "Electric Field", "Electric Field Lines", "Electric Flux", "Electric Dipole", "Dipole in a Uniform External Field", "Continuous Charge Distribution", "Gauss’s Law", "Applications of Gauss’s Law"] },
      { name: "Electrostatic Potential and Capacitance", subtopics: ["Electrostatic Potential", "Potential due to a Point Charge", "Potential due to an Electric Dipole", "Potential due to a System of Charges", "Equipotential Surfaces", "Potential Energy of a System of Charges", "Potential Energy in an External Field", "Electrostatics of Conductors", "Dielectrics and Polarisation", "Capacitors and Capacitance", "The Parallel Plate Capacitor", "Effect of Dielectric on Capacitance", "Combination of Capacitors", "Energy Stored in a Capacitor"] },
      { name: "Current Electricity", subtopics: ["Electric Current", "Electric Currents in Conductors", "Ohm’s law", "Drift of Electrons and the Origin of Resistivity", "Limitations of Ohm’s Law", "Resistivity of Various Materials", "Temperature Dependence of Resistivity", "Electrical Energy, Power", "Combination of Resistors — Series and Parallel", "Cells, emf, Internal Resistance", "Cells in Series and in Parallel", "Kirchhoff’s Rules", "Wheatstone Bridge", "Meter Bridge", "Potentiometer"] },
      { name: "Moving Charges and Magnetism", subtopics: ["Magnetic Force", "Motion in a Magnetic Field", "Motion in Combined Electric and Magnetic Fields", "Magnetic Field due to a Current Element, Biot-Savart Law", "Magnetic Field on the Axis of a Circular Current Loop", "Ampere’s Circuital Law", "The Solenoid and the Toroid", "Force between Two Parallel Currents, the Ampere", "Torque on Current Loop, Magnetic Dipole", "The Moving Coil Galvanometer"] },
      { name: "Magnetism and Matter", subtopics: ["The Bar Magnet", "Magnetism and Gauss’s Law", "The Earth’s Magnetism", "Magnetisation and Magnetic Intensity", "Magnetic Properties of Materials", "Permanent Magnets and Electromagnets"] },
      { name: "Electromagnetic Induction", subtopics: ["The Experiments of Faraday and Henry", "Magnetic Flux", "Faraday’s Law of Induction", "Lenz’s Law and Conservation of Energy", "Motional Electromotive Force", "Energy Consideration: A Quantitative Study", "Eddy Currents", "Inductance", "AC Generator"] },
      { name: "Alternating Current", subtopics: ["AC Voltage Applied to a Resistor", "Representation of AC Current and Voltage by Rotating Vectors — Phasors", "AC Voltage Applied to an Inductor", "AC Voltage Applied to a Capacitor", "AC Voltage Applied to a Series LCR Circuit", "Power in AC Circuit: The Power Factor", "LC Oscillations", "Transformers"] },
      { name: "Electromagnetic Waves", subtopics: ["Displacement Current", "Electromagnetic Waves", "Electromagnetic Spectrum"] },
      { name: "Ray Optics and Optical Instruments", subtopics: ["Reflection of Light by Spherical Mirrors", "Refraction", "Total Internal Reflection", "Refraction at Spherical Surfaces and by Lenses", "Refraction through a Prism", "Dispersion by a Prism", "Some Natural Phenomena due to Sunlight", "Optical Instruments"] },
      { name: "Wave Optics", subtopics: ["Huygens Principle", "Refraction and Reflection of Plane Waves using Huygens Principle", "Coherent and Incoherent Addition of Waves", "Interference of Light Waves and Young’s Experiment", "Diffraction", "Polarisation"] },
      { name: "Dual Nature of Radiation and Matter", subtopics: ["Electron Emission", "Photoelectric Effect", "Experimental Study of Photoelectric Effect", "Photoelectric Effect and Wave Theory of Light", "Einstein’s Photoelectric Equation: Energy Quantum of Radiation", "Particle Nature of Light: The Photon", "Wave Nature of Matter", "Davisson and Germer Experiment"] },
      { name: "Atoms", subtopics: ["Alpha-particle Scattering and Rutherford’s Nuclear Model of Atom", "Atomic Spectra", "Bohr Model of the Hydrogen Atom", "The Line Spectra of the Hydrogen Atom", "DE Broglie’s Explanation of Bohr’s Second Postulate of Quantisation"] },
      { name: "Nuclei", subtopics: ["Atomic Masses and Composition of Nucleus", "Size of the Nucleus", "Mass-Energy and Nuclear Binding Energy", "Nuclear Force", "Radioactivity", "Nuclear Energy"] },
      { name: "Semiconductor Electronics: Materials, Devices and Simple Circuits", subtopics: ["Classification of Metals, Conductors and Semiconductors", "Intrinsic Semiconductor", "Extrinsic Semiconductor", "p-n Junction", "Semiconductor Diode", "Application of Junction Diode as a Rectifier", "Special Purpose p-n Junction Diodes", "Junction Transistor", "Digital Electronics and Logic Gates", "Integrated Circuits"] },
      { name: "Communication Systems", subtopics: ["Elements of a Communication System", "Basic Terminology Used in Electronic Communication Systems", "Bandwidth of Signals", "Bandwidth of Transmission Medium", "Propagation of Electromagnetic Waves", "Modulation and its Necessity", "Amplitude Modulation", "Production of Amplitude Modulated Wave", "Detection of Amplitude Modulated Wave"] }
    ],
    "Chemistry": [
      { name: "Solutions", subtopics: ["Types of Solutions", "Expressing Concentration of Solutions", "Solubility", "Vapour Pressure of Liquid Solutions", "Ideal and Non-ideal Solutions", "Colligative Properties and Determination of Molar Mass", "Abnormal Molar Masses"] },
      { name: "Electrochemistry", subtopics: ["Electrochemical Cells", "Galvanic Cells", "Nernst Equation", "Conductance of Electrolytic Solutions", "Electrolytic Cells and Electrolysis", "Batteries", "Fuel Cells", "Corrosion"] },
      { name: "Chemical Kinetics", subtopics: ["Rate of a Chemical Reaction", "Factors Influencing Rate of a Reaction", "Integrated Rate Equations", "Pseudo First Order Reaction", "Temperature Dependence of the Rate of a Reaction", "Collision Theory of Chemical Reactions"] },
      { name: "The d-and f-Block Elements", subtopics: ["Position in the Periodic Table", "Electronic Configurations of the d-Block Elements", "General Properties of the Transition Elements (d-Block)", "Some Important Compounds of Transition Elements", "The Lanthanoids", "The Actinoids", "Some Applications of d- and f-Block Elements"] },
      { name: "Coordination Compounds", subtopics: ["Werner's Theory of Coordination Compounds", "Definitions of Some Important Terms Pertaining to Coordination Compounds", "Nomenclature of Coordination Compounds", "Isomerism in Coordination Compounds", "Bonding in Coordination Compounds", "Bonding in Metal Carbonyls", "Importance and Applications of Coordination Compounds"] },
      { name: "Haloalkanes and Haloarenes", subtopics: ["Classification", "Nomenclature", "Nature of C-X Bond", "Methods of Preparation of Haloalkanes", "Preparation of Haloarenes", "Physical Properties", "Chemical Reactions", "Polyhalogen Compounds"] },
      { name: "Alcohols, Phenols and Ethers", subtopics: ["Classification", "Nomenclature", "Structures of Functional Groups", "Alcohols and Phenols", "Some Commercially Important Alcohols", "Ethers"] },
      { name: "Aldehydes, Ketones and Carboxylic Acids", subtopics: ["Nomenclature and Structure of Carbonyl Group", "Preparation of Aldehydes and Ketones", "Physical Properties", "Chemical Reactions", "Uses of Aldehydes and Ketones", "Nomenclature and Structure of Carboxyl Group", "Methods of Preparation of Carboxylic Acids", "Physical Properties", "Chemical Reactions", "Uses of Carboxylic Acids"] },
      { name: "Amines", subtopics: ["Structure of Amines", "Classification", "Nomenclature", "Preparation of Amines", "Physical Properties", "Chemical Reactions", "Method of Preparation of Diazonium Salts", "Physical Properties", "Chemical Reactions", "Importance of Diazonium Salts in Synthesis of Aromatic Compounds"] },
      { name: "Biomolecules", subtopics: ["Carbohydrates", "Proteins", "Enzymes", "Vitamins", "Nucleic Acids", "Hormones"] }
    ],
    "Mathematics": [
      { name: "Relations and Functions", subtopics: ["Types of Relations", "Types of Functions", "Composition of Functions and Invertible Function", "Binary Operations"] },
      { name: "Inverse Trigonometric Functions", subtopics: ["Basic Concepts", "Properties of Inverse Trigonometric Functions"] },
      { name: "Matrices", subtopics: ["Matrix", "Types of Matrices", "Operations on Matrices", "Transpose of a Matrix", "Symmetric and Skew Symmetric Matrices", "Elementary Operation (Transformation) of a Matrix", "Invertible Matrices"] },
      { name: "Determinants", subtopics: ["Determinant", "Properties of Determinants", "Area of a Triangle", "Minors and Cofactors", "Adjoint and Inverse of a Matrix", "Applications of Determinants and Matrices"] },
      { name: "Continuity and Differentiability", subtopics: ["Continuity", "Differentiability", "Exponential and Logarithmic Functions", "Logarithmic Differentiation", "Derivatives of Functions in Parametric Forms", "Second Order Derivative", "Mean Value Theorem"] },
      { name: "Application of Derivatives", subtopics: ["Rate of Change of Quantities", "Increasing and Decreasing Functions", "Tangents and Normals", "Approximations", "Maxima and Minima"] },
      { name: "Integrals", subtopics: ["Integration as an Inverse Process of Differentiation", "Methods of Integration", "Integrals of some Particular Functions", "Integration by Partial Fractions", "Integration by Parts", "Definite Integral", "Fundamental Theorem of Calculus", "Evaluation of Definite Integrals by Substitution", "Some Properties of Definite Integrals"] },
      { name: "Application of Integrals", subtopics: ["Area under Simple Curves", "Area between Two Curves"] },
      { name: "Differential Equations", subtopics: ["Basic Concepts", "General and Particular Solutions of a Differential Equation", "Formation of a Differential Equation whose General Solution is given", "Methods of Solving First Order, First Degree Differential Equations"] },
      { name: "Vector Algebra", subtopics: ["Some Basic Concepts", "Types of Vectors", "Addition of Vectors", "Multiplication of a Vector by a Scalar", "Product of Two Vectors"] },
      { name: "Three Dimensional Geometry", subtopics: ["Direction Cosines and Direction Ratios of a Line", "Equation of a Line in Space", "Angle between Two Lines", "Shortest Distance between Two Lines", "Plane", "Coplanarity of Two Lines", "Angle between Two Planes", "Distance of a Point from a Plane", "Angle between a Line and a Plane"] },
      { name: "Linear Programming", subtopics: ["Linear Programming Problem and its Mathematical Formulation", "Graphical Method of Solving Linear Programming Problems"] },
      { name: "Probability", subtopics: ["Conditional Probability", "Multiplication Theorem on Probability", "Independent Events", "Bayes' Theorem", "Random Variables and its Probability Distributions", "Bernoulli Trials and Binomial Distribution"] }
    ],
    "Biology": [
      { name: "Reproduction in Organisms", subtopics: ["Asexual Reproduction", "Sexual Reproduction"] },
      { name: "Sexual Reproduction in Flowering Plants", subtopics: ["Flower—A Fascinating Organ of Angiosperms", "Pre-fertilisation: Structures and Events", "Double Fertilisation", "Post-fertilisation: Structures and Events", "Apomixis and Polyembryony"] },
      { name: "Human Reproduction", subtopics: ["The Male Reproductive System", "The Female Reproductive System", "Gametogenesis", "Menstrual Cycle", "Fertilisation and Implantation", "Pregnancy and Embryonic Development", "Parturition and Lactation"] },
      { name: "Reproductive Health", subtopics: ["Reproductive Health — Problems and Strategies", "Population Explosion and Birth Control", "Medical Termination of Pregnancy (MTP)", "Sexually Transmitted Diseases (STDs)", "Infertility"] },
      { name: "Principles of Inheritance and Variation", subtopics: ["Mendel’s Laws of Inheritance", "Inheritance of One Gene", "Inheritance of Two Genes", "Sex Determination", "Mutation", "Genetic Disorders"] },
      { name: "Molecular Basis of Inheritance", subtopics: ["The DNA", "The Search for Genetic Material", "RNA World", "Replication", "Transcription", "Genetic Code", "Translation", "Regulation of Gene Expression", "Human Genome Project", "DNA Fingerprinting"] },
      { name: "Evolution", subtopics: ["Origin of Life", "Evolution of Life Forms — A Theory", "What are the Evidences for Evolution?", "What is Adaptive Radiation?", "Biological Evolution", "Mechanism of Evolution", "Hardy-Weinberg Principle", "A Brief Account of Evolution", "Origin and Evolution of Man"] },
      { name: "Human Health and Disease", subtopics: ["Common Diseases in Humans", "Immunity", "AIDS", "Cancer", "Drugs and Alcohol Abuse"] },
      { name: "Strategies for Enhancement in Food Production", subtopics: ["Animal Husbandry", "Plant Breeding", "Single Cell Protein (SCP)", "Tissue Culture"] },
      { name: "Microbes in Human Welfare", subtopics: ["Microbes in Household Products", "Microbes in Industrial Products", "Microbes in Sewage Treatment", "Microbes in Production of Biogas", "Microbes as Biocontrol Agents", "Microbes as Biofertilisers"] },
      { name: "Biotechnology: Principles and Processes", subtopics: ["Principles of Biotechnology", "Tools of Recombinant DNA Technology", "Processes of Recombinant DNA Technology"] },
      { name: "Biotechnology and its Applications", subtopics: ["Biotechnological Applications in Agriculture", "Biotechnological Applications in Medicine", "Transgenic Animals", "Ethical Issues"] },
      { name: "Organisms and Populations", subtopics: ["Organism and Its Environment", "Populations"] },
      { name: "Ecosystem", subtopics: ["Ecosystem—Structure and Function", "Productivity", "Decomposition", "Energy Flow", "Ecological Pyramids", "Ecological Succession", "Nutrient Cycling", "Ecosystem Services"] },
      { name: "Biodiversity and Conservation", subtopics: ["Biodiversity", "Biodiversity Conservation"] },
      { name: "Environmental Issues", subtopics: ["Air Pollution and Its Control", "Water Pollution and Its Control", "Solid Wastes", "Agro-chemicals and their Effects", "Radioactive Wastes", "Greenhouse Effect and Global Warming", "Depletion of Ozone Layer in the Stratosphere", "Degradation by Improper Resource Utilisation and Maintenance", "Deforestation"] }
    ],
    "Accountancy": [
      { name: "Accounting for Partnership: Basic Concepts", subtopics: ["Nature of Partnership", "Partnership Deed", "Maintenance of Capital Accounts of Partners", "Profit and Loss Appropriation Account"] },
      { name: "Reconstitution of a Partnership Firm: Admission of a Partner", subtopics: ["New Profit Sharing Ratio", "Sacrificing Ratio", "Goodwill", "Revaluation of Assets and Liabilities"] }
    ],
    "Business Studies": [
      { name: "Nature and Significance of Management", subtopics: ["Management: Concept, Objectives and Importance", "Nature of Management", "Levels of Management", "Management Functions", "Coordination"] },
      { name: "Principles of Management", subtopics: ["Fayol's Principles of Management", "Taylor's Scientific Management"] }
    ],
    "Economics": [
      { name: "Introduction to Microeconomics", subtopics: ["Simple Economy", "Central Problems of an Economy", "Organisation of Economic Activities", "Positive and Normative Economics"] },
      { name: "Theory of Consumer Behaviour", subtopics: ["Utility", "Budget Set and Budget Line", "Optimal Choice of the Consumer", "Demand"] }
    ]
  }
};

declare global {
  interface Window {
    MathJax: any;
  }
}

export default function App() {
  const [selectedClass, setSelectedClass] = useState(CLASSES[1]);
  const [selectedStream, setSelectedStream] = useState(STREAMS[0]);
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [selectedChapter, setSelectedChapter] = useState("");
  const [selectedSubtopic, setSelectedSubtopic] = useState("");

  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<QuestionType[]>([
    QuestionType.MCQ, 
    QuestionType.FILL_IN_BLANKS, 
    QuestionType.TRUE_FALSE, 
    QuestionType.ASSERTION_REASON, 
    QuestionType.DESCRIPTIVE
  ]);
  const [generationMode, setGenerationMode] = useState<'bank' | 'ai'>('bank');
  const [viewMode, setViewMode] = useState<'config' | 'selection' | 'preview'>('config');
  const [collegeName, setCollegeName] = useState("GOVERNMENT PRE-UNIVERSITY COLLEGE");
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  
  const [questionPool, setQuestionPool] = useState<Question[]>([]);
  const [localBank, setLocalBank] = useState<Question[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);

  // Reset chapter when subject changes
  useEffect(() => {
    setSelectedChapter("");
    setSelectedSubtopic("");
    setSelectedQuestionIds(new Set());
  }, [selectedSubject, selectedClass]);

  // Reset subtopic when chapter changes
  useEffect(() => {
    setSelectedSubtopic("");
    setSelectedQuestionIds(new Set());
  }, [selectedChapter]);

  // Clear selections when subtopic changes
  useEffect(() => {
    setSelectedQuestionIds(new Set());
  }, [selectedSubtopic]);

  // Clear selections when question types change
  useEffect(() => {
    setSelectedQuestionIds(new Set());
  }, [selectedQuestionTypes]);

  // Reset criteria when stream changes
  useEffect(() => {
    setSelectedSubject(SUBJECTS[0]);
    setSelectedQuestionIds(new Set());
  }, [selectedStream]);

  // Clear selections when generation mode changes
  useEffect(() => {
    setSelectedQuestionIds(new Set());
  }, [generationMode]);

  // Load local bank from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pu_intelliq_local_bank');
    if (saved) {
      try {
        setLocalBank(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse local bank", e);
      }
    }
  }, []);

  // Combined bank for filtering
  const fullBank = useMemo(() => [...QUESTION_BANK, ...localBank], [localBank]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Trigger MathJax re-render when questions change
  useEffect(() => {
    if (window.MathJax) {
      window.MathJax.typesetPromise?.();
    }
  }, [generatedQuestions, questionPool]);

  const toggleQuestionSelection = (id: string) => {
    const newSelection = new Set(selectedQuestionIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedQuestionIds(newSelection);
  };

  useEffect(() => {
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise();
    }
  }, [viewMode, questionPool, generatedQuestions]);

  const fetchPoolFromBank = () => {
    const filtered = fullBank.filter(q => 
      q.class === selectedClass && 
      q.subject === selectedSubject &&
      (selectedChapter === "" || q.chapter === selectedChapter) &&
      (selectedSubtopic === "" || q.text.toLowerCase().includes(selectedSubtopic.toLowerCase())) &&
      (selectedQuestionTypes.length === 0 || selectedQuestionTypes.includes(q.type))
    );
    return filtered;
  };

  const [generationStatus, setGenerationStatus] = useState<string>("");
  const [generationProgress, setGenerationProgress] = useState(0);

  const EDUCATIONAL_FACTS = [
    "The Karnataka PU Board was established in 1966.",
    "Over 7 lakh students appear for PU exams every year in Karnataka.",
    "Model papers are designed to test both knowledge and application skills.",
    "The 2025-26 blueprint emphasizes more objective-type questions in Part A.",
    "PU education is a crucial bridge between high school and higher education.",
    "Karnataka was one of the first states to introduce a separate PU Board.",
    "The board ensures uniform standards across all PU colleges in the state.",
    "Continuous evaluation helps in better understanding of core concepts."
  ];

  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  useEffect(() => {
    if (isAiProcessing) {
      const interval = setInterval(() => {
        setCurrentFactIndex(prev => (prev + 1) % EDUCATIONAL_FACTS.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isAiProcessing]);

  const fetchPoolFromAI = async (isLoadMore = false) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      setError("Gemini API Key is missing. Please set GEMINI_API_KEY in your environment variables.");
      return;
    }

    setIsAiProcessing(true);
    setGenerationProgress(0);
    setGenerationStatus(isLoadMore ? "Fetching More Questions..." : "Initializing AI Model...");
    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-3-flash-preview";

    const prompt = `Generate a large pool of questions for a Karnataka PU Board ${selectedClass} ${selectedSubject} exam.
    Stream: ${selectedStream}
    Chapter/Topic: ${selectedChapter || "Full Syllabus"}
    Sub-topic: ${selectedSubtopic || "All sub-topics"}
    Allowed Question Types: ${selectedQuestionTypes.join(", ")}
    
    The output must be a JSON array of objects matching this schema:
    {
      "id": "string (unique uuid)",
      "text": "string",
      "marks": number,
      "part": "Part A" | "Part B" | "Part C" | "Part D",
      "type": "MCQ" | "Fill in the Blanks" | "True/False" | "Assertion & Reasoning" | "Descriptive",
      "options": ["string", "string", "string", "string"] (only for MCQ),
      "subject": "${selectedSubject}",
      "class": "${selectedClass}",
      "stream": "${selectedStream}",
      "chapter": "${selectedChapter || "General " + selectedSubject}",
      "isMath": boolean,
      "difficulty": "Easy" | "Medium" | "Hard",
      "answer": "string (detailed marking scheme answer)"
    }

    Blueprint Pool Requirements:
    - Part A: 15 questions (ONLY use these types: ${selectedQuestionTypes.filter(t => t !== QuestionType.DESCRIPTIVE).join(", ") || "MCQ"} - 1 mark each)
    - Part B: 10 questions (Descriptive - 2 marks each)
    - Part C: 10 questions (Descriptive - 3 marks each)
    - Part D: 10 questions (Descriptive - 5 marks each)
    Total: 45 questions.
    
    CRITICAL: Only generate questions of the following types: ${selectedQuestionTypes.join(", ")}.
    If "Descriptive" is not selected, do not generate Part B, C, or D questions.
    If objective types are not selected, do not generate Part A questions.
    
    CRITICAL: If a sub-topic is specified (${selectedSubtopic}), ensure the questions are focused on that specific area.
    The sub-topic is: ${selectedSubtopic}. All questions must be strictly related to this sub-topic.

    Ensure Science/Math questions use LaTeX for formulas (e.g., \\( E = mc^2 \\)).
    CRITICAL: For ALL mathematical content, formulas, variables (like V, x, y, λ), or scientific notation, you MUST use LaTeX delimiters: \\( ... \\) for inline and \\[ ... \\] for block math.
    CRITICAL: This applies to the "text" field, "options" array, and "answer" field.
    CRITICAL: If ANY field (text, options, or answer) contains LaTeX or mathematical symbols, the "isMath" property MUST be set to true.
    CRITICAL: Do NOT use plain text for math (e.g., use \\( V \\) instead of just V).
    CRITICAL: For MCQ options, if they contain math, use LaTeX delimiters like \\( ... \\) inside the option strings.
    
    ${isLoadMore ? "IMPORTANT: Generate DIFFERENT questions from the ones already provided. Focus on deeper concepts." : ""}
    `;

    try {
      setGenerationStatus(isLoadMore ? "Searching for New Concepts..." : "Analyzing Karnataka PU Board Blueprint...");
      const result = await ai.models.generateContentStream({
        model,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING },
                marks: { type: Type.NUMBER },
                part: { type: Type.STRING, enum: ["Part A", "Part B", "Part C", "Part D"] },
                type: { type: Type.STRING, enum: ["MCQ", "Fill in the Blanks", "True/False", "Assertion & Reasoning", "Descriptive"] },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                subject: { type: Type.STRING },
                class: { type: Type.STRING },
                stream: { type: Type.STRING },
                chapter: { type: Type.STRING },
                isMath: { type: Type.BOOLEAN },
                difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
                answer: { type: Type.STRING }
              },
              required: ["id", "text", "marks", "part", "type", "subject", "class", "stream", "chapter"]
            }
          }
        }
      });

      let fullText = "";
      let chunkCount = 0;
      for await (const chunk of result) {
        fullText += chunk.text;
        chunkCount++;
        
        // Dynamic status updates based on chunks
        if (chunkCount === 2) {
          setGenerationStatus("Generating Part A (MCQs & Objective)...");
          setGenerationProgress(20);
        }
        if (chunkCount === 5) {
          setGenerationStatus("Crafting Part B & C (Short Answers)...");
          setGenerationProgress(50);
        }
        if (chunkCount === 8) {
          setGenerationStatus("Designing Part D (Long Answers)...");
          setGenerationProgress(80);
        }
        if (chunkCount === 12) {
          setGenerationStatus("Finalizing LaTeX Formulas & Marking Scheme...");
          setGenerationProgress(95);
        }
      }

      const data = JSON.parse(fullText);
      
      // Auto-save to local bank
      setLocalBank(prev => {
        const existingTexts = new Set(prev.map(q => q.text));
        const uniqueAi = data.filter((q: Question) => !existingTexts.has(q.text));
        if (uniqueAi.length === 0) return prev;
        const updated = [...prev, ...uniqueAi];
        localStorage.setItem('pu_intelliq_local_bank', JSON.stringify(updated));
        return updated;
      });

      setQuestionPool(prev => {
        const existingTexts = new Set(prev.map(q => q.text));
        const uniqueAi = data.filter((q: Question) => !existingTexts.has(q.text));
        return [...prev, ...uniqueAi];
      });
      setGenerationProgress(100);
      setGenerationStatus("Generation Complete!");
    } catch (err) {
      console.error(err);
      setError("AI background processing failed. Using bank questions only.");
    } finally {
      setIsAiProcessing(false);
      setTimeout(() => setGenerationStatus(""), 3000);
    }
  };

  const startGeneration = async () => {
    setIsGenerating(true);
    setError(null);
    
    // 1. Load Bank Questions Immediately
    const bankQuestions = fetchPoolFromBank();
    setQuestionPool(bankQuestions);
    setViewMode('selection');
    setIsGenerating(false);

    // 2. Start AI Processing in Background if mode is AI
    if (generationMode === 'ai') {
      fetchPoolFromAI();
    }
  };

  const finalizePaper = () => {
    const selected = questionPool.filter(q => selectedQuestionIds.has(q.id));
    // Sort by Part A, B, C, D
    const sorted = [...selected].sort((a, b) => {
      const order = { [Part.A]: 1, [Part.B]: 2, [Part.C]: 3, [Part.D]: 4 };
      return order[a.part] - order[b.part];
    });
    setGeneratedQuestions(sorted);
    setViewMode('preview');
  };

  const exportToPDF = async () => {
    const element = document.getElementById('question-paper');
    if (!element) return;

    // Wait for MathJax to finish rendering
    if (window.MathJax && window.MathJax.typesetPromise) {
      await window.MathJax.typesetPromise([element]);
    }

    // Small delay to ensure rendering is complete
    await new Promise(resolve => setTimeout(resolve, 500));

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
      onclone: (clonedDoc) => {
        // Ensure the cloned element is visible for capture
        const el = clonedDoc.getElementById('question-paper');
        if (el) el.style.display = 'block';
      }
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`KA_PU_${selectedSubject}_${selectedClass}_Paper.pdf`);
  };

  const cleanLatexForWord = (text: string) => {
    // Basic replacements for common LaTeX symbols to make it readable in Word
    return text
      .replace(/\\\(/g, '')
      .replace(/\\\)/g, '')
      .replace(/\\\[/g, '')
      .replace(/\\\]/g, '')
      .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)')
      .replace(/\\times/g, '×')
      .replace(/\\pm/g, '±')
      .replace(/\\alpha/g, 'α')
      .replace(/\\beta/g, 'β')
      .replace(/\\gamma/g, 'γ')
      .replace(/\\theta/g, 'θ')
      .replace(/\\pi/g, 'π')
      .replace(/\\infty/g, '∞')
      .replace(/\\Delta/g, 'Δ')
      .replace(/\\Sigma/g, 'Σ')
      .replace(/\\Omega/g, 'Ω')
      .replace(/\\epsilon/g, 'ε')
      .replace(/\\lambda/g, 'λ')
      .replace(/\^\{([^}]+)\}/g, '^$1')
      .replace(/_\{([^}]+)\}/g, '_$1')
      .replace(/\\text\{([^}]+)\}/g, '$1')
      .replace(/\\/g, ''); // Final cleanup of remaining backslashes
  };

  const exportToWord = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: "Department of Pre-University Education, Karnataka",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: "Model Question Paper",
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Class: ${selectedClass} | Subject: ${selectedSubject} | Stream: ${selectedStream}`, bold: true }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 400 },
          }),
          ...[Part.A, Part.B, Part.C, Part.D].flatMap(part => {
            const partQuestions = generatedQuestions.filter(q => q.part === part);
            if (partQuestions.length === 0) return [];

            return [
              new Paragraph({
                text: part,
                heading: HeadingLevel.HEADING_3,
                alignment: AlignmentType.CENTER,
                spacing: { before: 400, after: 200 },
              }),
              ...partQuestions.flatMap((q, idx) => {
                const questionText = q.isMath ? cleanLatexForWord(q.text) : q.text;
                const questionParagraph = new Paragraph({
                  children: [
                    new TextRun({ text: `${idx + 1}. `, bold: true }),
                    new TextRun({ text: questionText }),
                    new TextRun({ text: ` (${q.marks})`, bold: true }),
                  ],
                  spacing: { before: 100, after: 100 },
                });

                if (q.type === 'MCQ' && q.options) {
                  const optionsParagraph = new Paragraph({
                    children: q.options.map((opt, i) => {
                      const optText = q.isMath ? cleanLatexForWord(opt) : opt;
                      return new TextRun({ 
                        text: `${String.fromCharCode(97 + i)}) ${optText}    `,
                        break: i % 2 === 0 && i !== 0 ? 0 : 0 // Simple spacing
                      });
                    }),
                    indent: { left: 720 }, // Indent options
                    spacing: { after: 100 }
                  });
                  return [questionParagraph, optionsParagraph];
                }

                return [questionParagraph];
              })
            ];
          })
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `KA_PU_${selectedSubject}_${selectedClass}_Paper.docx`);
  };

  const selectedCountByPart = useMemo(() => {
    const counts = { [Part.A]: 0, [Part.B]: 0, [Part.C]: 0, [Part.D]: 0 };
    let totalMarks = 0;
    Array.from(selectedQuestionIds).forEach(id => {
      const q = questionPool.find(qp => qp.id === id);
      if (q) {
        counts[q.part]++;
        totalMarks += q.marks;
      }
    });
    return { counts, totalMarks };
  }, [selectedQuestionIds, questionPool]);

  const difficultyDistribution = useMemo(() => {
    const dist = { Easy: 0, Medium: 0, Hard: 0 };
    Array.from(selectedQuestionIds).forEach(id => {
      const q = questionPool.find(qp => qp.id === id);
      if (q && q.difficulty) {
        dist[q.difficulty]++;
      }
    });
    return dist;
  }, [selectedQuestionIds, questionPool]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <FileText className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">
              PU <span className="text-indigo-600">IntelliQ</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden sm:inline">Faculty Portal</span>
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
              <Settings className="w-4 h-4 text-slate-600" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar Controls */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
              <div className="flex items-center gap-2 text-indigo-600 font-semibold mb-2">
                <Layers className="w-5 h-5" />
                <h2>Paper Configuration</h2>
              </div>

              {/* Generation Mode Toggle */}
              <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                <button
                  onClick={() => setGenerationMode('bank')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all",
                    generationMode === 'bank' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <Database className="w-4 h-4" />
                  Bank
                </button>
                <button
                  onClick={() => setGenerationMode('ai')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all",
                    generationMode === 'ai' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <Sparkles className="w-4 h-4" />
                  AI Gen
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CLASSES.map(c => (
                      <button
                        key={c}
                        onClick={() => setSelectedClass(c)}
                        className={cn(
                          "py-2 px-4 rounded-xl text-sm font-medium transition-all border",
                          selectedClass === c 
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm" 
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stream</label>
                  <select 
                    value={selectedStream}
                    onChange={(e) => setSelectedStream(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    {STREAMS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</label>
                  <select 
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chapter</label>
                  <select 
                    value={selectedChapter}
                    onChange={(e) => setSelectedChapter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    <option value="">All Chapters (Full Syllabus)</option>
                    {CHAPTER_MAPPING[selectedClass]?.[selectedSubject]?.map(chapter => (
                      <option key={chapter.name} value={chapter.name}>{chapter.name}</option>
                    ))}
                  </select>
                </div>

                {selectedChapter && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sub-topic (Optional)</label>
                    <select 
                      value={selectedSubtopic}
                      onChange={(e) => setSelectedSubtopic(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      <option value="">All Sub-topics</option>
                      {CHAPTER_MAPPING[selectedClass]?.[selectedSubject]
                        ?.find(c => c.name === selectedChapter)
                        ?.subtopics.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                    </select>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Question Types</label>
                  <div className="grid grid-cols-1 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    {Object.values(QuestionType).map(type => (
                      <label key={type} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox"
                          checked={selectedQuestionTypes.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedQuestionTypes([...selectedQuestionTypes, type]);
                            } else {
                              setSelectedQuestionTypes(selectedQuestionTypes.filter(t => t !== type));
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-medium text-slate-600 group-hover:text-indigo-600 transition-colors">
                          {type}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <LayoutGrid className="w-3 h-3" />
                      Institutional Branding
                    </label>
                    <input 
                      type="text"
                      placeholder="College Name"
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm font-medium text-slate-700">Generate Answer Key</span>
                    </div>
                    <button 
                      onClick={() => setShowAnswerKey(!showAnswerKey)}
                      className={cn(
                        "w-10 h-6 rounded-full transition-all relative",
                        showAnswerKey ? "bg-indigo-600" : "bg-slate-300"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        showAnswerKey ? "left-5" : "left-1"
                      )} />
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={startGeneration}
                disabled={isGenerating}
                className={cn(
                  "w-full font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group",
                  generationMode === 'ai' 
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-indigo-200"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
                )}
              >
                {isGenerating ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>{generationMode === 'ai' ? 'Fetch AI Pool' : 'Fetch Bank Pool'}</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>

            {viewMode === 'selection' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6"
              >
                <div className="flex items-center justify-between text-indigo-600 font-semibold">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5" />
                    <h3>Blueprint Validator</h3>
                  </div>
                  <div className={cn(
                    "text-xs px-2 py-1 rounded-md font-bold",
                    selectedCountByPart.totalMarks === 70 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {selectedCountByPart.totalMarks} / 70 Marks
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(selectedCountByPart.counts).map(([part, count]) => (
                    <div key={part} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{part}</p>
                      <p className="text-lg font-bold text-slate-700">{count}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Difficulty Balance</h4>
                  <div className="space-y-2">
                    {Object.entries(difficultyDistribution).map(([diff, count]) => (
                      <div key={diff} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>{diff}</span>
                          <span>{count}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${((count as number) / (selectedQuestionIds.size || 1)) * 100}%` }}
                            className={cn(
                              "h-full rounded-full",
                              diff === 'Easy' ? "bg-emerald-500" : diff === 'Medium' ? "bg-amber-500" : "bg-rose-500"
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={finalizePaper}
                  disabled={selectedQuestionIds.size === 0}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Wand2 className="w-5 h-5" />
                  <span>Finalize Paper</span>
                </button>
              </motion.div>
            )}

            <div className="bg-indigo-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-indigo-300" />
                  <h3 className="font-bold">Blueprint Info</h3>
                </div>
                <p className="text-sm text-indigo-100 leading-relaxed">
                  Generated papers follow the official Karnataka PU Board blueprint for 2025-26.
                </p>
                <ul className="mt-4 space-y-2 text-xs text-indigo-200">
                  <li className="flex items-center gap-2">• Part A: 1 Mark MCQs</li>
                  <li className="flex items-center gap-2">• Part B: 2 Mark Short Ans</li>
                  <li className="flex items-center gap-2">• Part C: 3 Mark Short Ans</li>
                  <li className="flex items-center gap-2">• Part D: 5 Mark Long Ans</li>
                </ul>
              </div>
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-indigo-800 rounded-full opacity-50 blur-2xl"></div>
            </div>
          </aside>

          {/* Main Content Area */}
          <section className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {viewMode === 'selection' ? (
                <motion.div
                  key="selection"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-100 p-2 rounded-lg">
                        <LayoutGrid className="text-indigo-600 w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          Question Pool
                          {isAiProcessing && (
                            <div className="flex flex-col gap-2 w-64">
                              <div className="flex items-center justify-between text-[10px] font-bold text-indigo-600">
                                <span className="flex items-center gap-1 animate-pulse">
                                  <RefreshCw className="w-2 h-2 animate-spin" />
                                  {generationStatus}
                                </span>
                                <span>{generationProgress}%</span>
                              </div>
                              <div className="h-1 w-full bg-indigo-100 rounded-full overflow-hidden">
                                <motion.div 
                                  className="h-full bg-indigo-600"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${generationProgress}%` }}
                                  transition={{ duration: 0.5 }}
                                />
                              </div>
                              <p className="text-[9px] text-slate-400 italic truncate">
                                Did you know? {EDUCATIONAL_FACTS[currentFactIndex]}
                              </p>
                            </div>
                          )}
                        </h3>
                        <p className="text-xs text-slate-500">Select questions to include in your paper</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selected</p>
                        <p className="text-sm font-bold text-indigo-600">{selectedQuestionIds.size} Questions</p>
                      </div>
                      <button
                        onClick={finalizePaper}
                        disabled={selectedQuestionIds.size === 0}
                        className={cn(
                          "px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg",
                          selectedQuestionIds.size > 0
                            ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        )}
                      >
                        <span>Generate Paper</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {[Part.A, Part.B, Part.C, Part.D].map(part => {
                      const partQuestions = questionPool.filter(q => q.part === part);
                      if (partQuestions.length === 0) return null;

                      return (
                        <div key={part} className="space-y-4">
                          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-8 h-[1px] bg-slate-200"></span>
                            {part}
                            <span className="flex-1 h-[1px] bg-slate-200"></span>
                          </h4>
                          <div className="grid grid-cols-1 gap-3">
                            {partQuestions.map(q => (
                              <button
                                key={q.id}
                                onClick={() => toggleQuestionSelection(q.id)}
                                className={cn(
                                  "text-left p-4 rounded-2xl border transition-all flex items-start gap-4 group",
                                  selectedQuestionIds.has(q.id)
                                    ? "bg-indigo-50 border-indigo-200 shadow-sm"
                                    : "bg-white border-slate-200 hover:border-indigo-200"
                                )}
                              >
                                <div className={cn(
                                  "mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                  selectedQuestionIds.has(q.id)
                                    ? "bg-indigo-600 border-indigo-600 text-white"
                                    : "border-slate-200 group-hover:border-indigo-300"
                                )}>
                                  {selectedQuestionIds.has(q.id) ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4 text-slate-300" />}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded uppercase tracking-wider">
                                      {q.type}
                                    </span>
                                    <p className={cn("text-sm leading-relaxed", q.isMath ? "math-tex" : "")}>{q.text}</p>
                                  </div>
                                  {q.type === 'MCQ' && q.options && (
                                    <div className="grid grid-cols-2 gap-2 mt-2 ml-2">
                                      {q.options.map((opt, i) => (
                                        <div key={i} className="text-xs text-slate-500 flex gap-1">
                                          <span className="font-bold">{String.fromCharCode(97 + i)})</span>
                                          <span className={q.isMath ? "math-tex" : ""}>{opt}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-3 mt-2">
                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded uppercase">{q.marks} Marks</span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded uppercase">{q.chapter}</span>
                                    {q.difficulty && (
                                      <span className={cn(
                                        "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                                        q.difficulty === 'Easy' ? "bg-emerald-50 text-emerald-600" : 
                                        q.difficulty === 'Medium' ? "bg-amber-50 text-amber-600" : 
                                        "bg-rose-50 text-rose-600"
                                      )}>
                                        {q.difficulty}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {generationMode === 'ai' && (
                    <div className="flex justify-center pt-4">
                      <button
                        onClick={() => fetchPoolFromAI(true)}
                        disabled={isAiProcessing}
                        className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-indigo-100 text-indigo-600 rounded-2xl font-bold hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm group"
                      >
                        {isAiProcessing ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            <span>Load More AI Questions</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : viewMode === 'preview' ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="space-y-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <FileText className="text-green-600 w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">Final Question Paper</h3>
                        <p className="text-xs text-slate-500">{generatedQuestions.length} questions selected</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewMode('selection')}
                        className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Edit Selection
                      </button>
                      <button
                        onClick={exportToPDF}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        PDF
                      </button>
                      <button
                        onClick={exportToWord}
                        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
                      >
                        <FileDown className="w-4 h-4" />
                        Word
                      </button>
                    </div>
                  </div>

                  <div className="overflow-auto max-h-[800px] border border-slate-200 rounded-2xl">
                    <QuestionPaper 
                      questions={generatedQuestions}
                      subject={selectedSubject}
                      className={selectedClass}
                      stream={selectedStream}
                      collegeName={collegeName}
                      showAnswerKey={showAnswerKey}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[500px]"
                >
                  <div className="bg-slate-50 p-6 rounded-full mb-6">
                    <FileText className="w-12 h-12 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Ready to Build Your Paper?</h3>
                  <p className="text-slate-500 max-w-xs mx-auto mb-8">
                    Choose your subject and generation mode. We'll provide a pool of questions for you to hand-pick from.
                  </p>
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-full text-sm font-medium">
                    <AlertCircle className="w-4 h-4" />
                    <span>Advanced: Manual selection & Word export enabled</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-slate-200 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm text-slate-500">
            © 2026 Karnataka PU Board Question Generator. All Rights Reserved.
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
