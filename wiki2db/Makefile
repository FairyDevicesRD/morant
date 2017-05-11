

# Required Arguments --------------------------------------
WIKIP_EXTRACTED :=
NORMALIZER :=

WikiExtractor := $(shell which WikiExtractor.py)
MECAB := $(shell which mecab)
MECAB_OPT :=

# Remove a last slash character
MY_OUT_DIR := $(OUT_DIR:/=)
MY_WIKIP_EXTRACTED := $(WIKIP_EXTRACTED:/=)

# Check arguments
check_defined = \
    $(foreach 1,$1,$(__check_defined))
__check_defined = \
    $(if $(value $1),, \
      $(error Undefined $1$(if $(value 2), ($(strip $2)))))
$(call check_defined, WIKIP_EXTRACTED NORMALIZER OUT_DIR, "Required Arguments")


# Options -------------------------------------------------
TMP := /tmp


# Settings ------------------------------------------------
CURRENT_DIR = $(shell pwd)

DATA_EXT := bz2
EXTRACTED_FILES := $(shell find $(MY_WIKIP_EXTRACTED) -name '*.$(DATA_EXT)' -follow 2>/dev/null )
OUT_PLAIN_DIR := $(MY_OUT_DIR)/plains
OUT_PLAIN_FILES := $(patsubst $(MY_WIKIP_EXTRACTED)/%.$(DATA_EXT),$(OUT_PLAIN_DIR)/%.gz, $(EXTRACTED_FILES))

OUT_UNIQED := $(MY_OUT_DIR)/plain.uniq.gz
OUT_UNIQED_NORMALIZED := $(MY_OUT_DIR)/plain.uniq.normalized.gz
OUT_UNIQED_NORMALIZED_MECABED := $(MY_OUT_DIR)/plain.uniq.normalized.mecab.gz
OUT_DB := $(MY_OUT_DIR)/wikip.db


# The first target (all) ----------------------------------
all : PLAINS \
    $(OUT_UNIQED) $(OUT_UNIQED_NORMALIZED) $(OUT_UNIQED_NORMALIZED_MECABED) \
    $(OUT_DB)

# Commands ------------------------------------------------


# Rules ---------------------------------------------------

$(OUT_PLAIN_DIR)/%.gz: $(MY_WIKIP_EXTRACTED)/%.$(DATA_EXT)
	mkdir -p $(dir $@) \
	&& bzcat $< | python3 get_texts.py | gzip > $@.tmp \
	    && mv $@.tmp $@

PLAINS: $(OUT_PLAIN_FILES)

$(OUT_UNIQED) : $(OUT_PLAIN_FILES)
	mkdir -p $(dir $@) \
	&& find $(OUT_PLAIN_DIR) -type f \
	    | xargs zcat \
	    | LANG=C sort -k2 \
	    | awk '{if($$2!=prev){print}; prev=$$2}' \
	    | gzip > $@.tmp \
	&& mv $@.tmp $@

$(OUT_UNIQED_NORMALIZED) : $(OUT_UNIQED)
	mkdir -p $(dir $@) \
	&& zcat $< | cut -f2 | $(NORMALIZER) \
	    | gzip > $@.tmp \
	&& mv $@.tmp $@

$(OUT_UNIQED_NORMALIZED_MECABED): $(OUT_UNIQED_NORMALIZED)
	mkdir -p $(dir $@) \
	&& zcat $< | cut -f2 \
	    | $(MECAB) -F"%m/%f[0]/%f[1] " -U"%m/UNK/ " -E"\n" $(MECAB_OPT) \
	    | gzip > $@.tmp \
	&& mv $@.tmp $@

$(OUT_DB): $(OUT_UNIQED) $(OUT_UNIQED_NORMALIZED) $(OUT_UNIQED_NORMALIZED_MECABED)
	mkdir -p $(dir $@) \
	&& bash -c 'paste <( zcat $(OUT_UNIQED) | cut -f1) <( zcat $(OUT_UNIQED_NORMALIZED) | cut -f2) <(zcat $(OUT_UNIQED_NORMALIZED_MECABED) )' \
	    | python3 make_db.py  -o $@

clean:


# special targets
.PHONY: all clean
.DELETE_ON_ERROR:

